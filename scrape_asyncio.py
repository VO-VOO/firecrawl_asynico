
"""
文章异步爬虫
使用 asyncio+Firecrawl 实现异步并发爬取
性能优化版本 - 支持 GUI 模式
"""

import json
import os
import sys
import time
import signal
import asyncio
import aiofiles
from pathlib import Path
from firecrawl import AsyncFirecrawl
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict, Optional, AsyncIterator
from aiohttp import ClientError

# 配置
FIRECRAWL_URL = os.environ.get("FIRECRAWL_URL", "http://localhost:8547")
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "test")  # 本地部署可使用任意字符串
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", str(BASE_DIR)))
ARTICLES_FILE = Path(os.environ.get("ARTICLES_FILE", str(BASE_DIR / "cbre_data_center_articles.json")))

# 并发配置
MAX_CONCURRENT = int(os.environ.get("MAX_CONCURRENT", "15"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "50"))
RETRY_COUNT = 3  # 失败重试次数
RETRY_DELAY_BASE = 1.0  # 重试基础延迟（秒），使用指数退避
REQUEST_TIMEOUT = 60.0  # 单个请求超时时间（秒）

# GUI 模式
GUI_MODE = os.environ.get("GUI_MODE", "false").lower() == "true"

# 全局停止标志
_stop_requested = False


def emit_json(data: dict):
    """输出 JSON Line 到 stdout（仅在 GUI 模式下）"""
    if GUI_MODE:
        print(json.dumps(data, ensure_ascii=False), flush=True)


def emit_progress(total: int, completed: int, success: int, failed: int, pending: int, running: int, eta: Optional[float] = None):
    """输出进度更新"""
    percentage = round(completed / total * 100, 2) if total > 0 else 0
    emit_json({
        "type": "progress",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "data": {
            "total": total,
            "completed": completed,
            "success": success,
            "failed": failed,
            "pending": pending,
            "running": running,
            "percentage": percentage,
            "eta": eta
        }
    })


def emit_task_update(index: int, url: str, title: str, status: str, progress: int = 0, error: Optional[str] = None, elapsed: float = 0):
    """输出任务状态更新"""
    emit_json({
        "type": "task",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "data": {
            "id": f"task-{index:04d}",
            "index": index,
            "url": url,
            "title": title,
            "status": status,
            "progress": progress,
            "error": error,
            "elapsed": elapsed
        }
    })


def emit_complete(total: int, success: int, failed: int, elapsed: float, failed_tasks: List[dict]):
    """输出完成通知"""
    emit_json({
        "type": "complete",
        "timestamp": int(datetime.now().timestamp() * 1000),
        "data": {
            "total": total,
            "success": success,
            "failed": failed,
            "elapsed": elapsed,
            "failedTasks": failed_tasks
        }
    })


def setup_signal_handlers():
    """设置信号处理器以支持优雅停止"""
    global _stop_requested

    def handle_signal(signum, frame):
        global _stop_requested
        _stop_requested = True
        if not GUI_MODE:
            print("\n收到停止信号，正在优雅退出...")

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)


@dataclass
class ScrapeResult:
    """爬取结果"""
    index: int
    title: str
    url: str
    success: bool
    error: Optional[str] = None
    elapsed: float = 0.0


async def load_articles_async() -> List[Dict[str, str]]:
    """
    异步从JSON文件加载文章列表

    Returns:
        文章列表，每个文章包含 'title' 和 'url' 键

    Raises:
        FileNotFoundError: 文件不存在
        ValueError: JSON 格式不正确
    """
    async with aiofiles.open(ARTICLES_FILE, 'r', encoding='utf-8') as f:
        content = await f.read()
        data = json.loads(content)

    if 'articles' not in data:
        raise ValueError("JSON 文件缺少 'articles' 键")

    articles = data['articles']
    for i, article in enumerate(articles):
        if 'title' not in article or 'url' not in article:
            raise ValueError(f"文章 {i} 缺少 'title' 或 'url' 键")

    return articles


async def get_existing_indices(output_dir: Path) -> set[int]:
    """
    异步获取已存在文件的索引集合

    Args:
        output_dir: 输出目录

    Returns:
        已存在文件的索引集合
    """
    # 使用 asyncio.to_thread 包装同步的 glob 操作
    existing_files = await asyncio.to_thread(lambda: list(output_dir.glob("*.md")))

    existing_indices: set[int] = set()
    for file in existing_files:
        try:
            idx = int(file.name[:3])
            existing_indices.add(idx)
        except (ValueError, IndexError):
            pass

    return existing_indices


async def scrape_single_article(
    semaphore: asyncio.Semaphore,
    client: AsyncFirecrawl,
    index: int,
    title: str,
    url: str,
    total: int,
    output_dir: str
) -> ScrapeResult:
    """
    异步爬取单篇文章（带超时和指数退避重试）

    Args:
        semaphore: 并发控制信号量
        client: 共享的 AsyncFirecrawl 客户端
        index: 文章索引
        title: 文章标题
        url: 文章 URL
        total: 总文章数
        output_dir: 输出目录

    Returns:
        ScrapeResult: 爬取结果
    """
    global _stop_requested

    result = ScrapeResult(
        index=index,
        title=title,
        url=url,
        success=False
    )

    start_time = time.time()

    # 检查是否收到停止请求
    if _stop_requested:
        result.error = "Stopped by user"
        result.elapsed = time.time() - start_time
        return result

    async with semaphore:
        try:
            if not GUI_MODE:
                print(f"[{index}/{total}] 开始爬取: {title[:60]}...")

            # 发送任务开始状态
            emit_task_update(index, url, title, "running", 10, elapsed=0)

            # 爬取文章（带指数退避重试）
            for attempt in range(RETRY_COUNT):
                if _stop_requested:
                    result.error = "Stopped by user"
                    result.elapsed = time.time() - start_time
                    emit_task_update(index, url, title, "failed", 0, error=result.error, elapsed=result.elapsed)
                    return result

                try:
                    # 更新进度：正在请求
                    emit_task_update(index, url, title, "running", 30 + attempt * 20, elapsed=time.time() - start_time)

                    # 添加超时控制
                    doc = await asyncio.wait_for(
                        client.scrape(
                            url,
                            formats=["markdown"],
                            only_main_content=True,
                        ),
                        timeout=REQUEST_TIMEOUT
                    )

                    if not doc or not doc.markdown:
                        raise ValueError("无法获取内容")

                    # 更新进度：正在保存
                    emit_task_update(index, url, title, "running", 80, elapsed=time.time() - start_time)

                    # 创建安全的文件名（移除可能导致问题的字符）
                    safe_title = "".join(
                        c for c in title
                        if c.isalnum() or c in (' ', '-', '_', '，', '。', '？', '！', '&', ':')
                    ).rstrip()
                    safe_title = safe_title[:100]
                    filename = f"{index:03d}_{safe_title}.md"
                    filepath = Path(output_dir) / filename

                    # 异步写入文件
                    content = (
                        f"# {index}. {title}\n\n"
                        f"**URL:** {url}\n\n"
                        f"**抓取时间:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                        "---\n\n"
                        f"{doc.markdown}"
                    )
                    async with aiofiles.open(filepath, 'w', encoding='utf-8') as f:
                        await f.write(content)

                    result.success = True
                    result.elapsed = time.time() - start_time

                    if not GUI_MODE:
                        print(f"[{index}/{total}] ✓ 成功 ({result.elapsed:.1f}s): {filepath.name}")

                    # 发送任务成功状态
                    emit_task_update(index, url, title, "success", 100, elapsed=result.elapsed)
                    return result

                except (ClientError, asyncio.TimeoutError, ValueError, ConnectionError) as e:
                    if attempt < RETRY_COUNT - 1:
                        # 指数退避: 1s, 2s, 4s...
                        delay = RETRY_DELAY_BASE * (2 ** attempt)
                        if not GUI_MODE:
                            print(f"[{index}/{total}] 第{attempt+1}次尝试失败: {str(e)[:100]}，{delay:.1f}秒后重试...")
                        await asyncio.sleep(delay)
                    else:
                        result.error = str(e)
                        result.elapsed = time.time() - start_time
                        if not GUI_MODE:
                            print(f"[{index}/{total}] ❌ 失败: {str(e)[:100]}")
                        emit_task_update(index, url, title, "failed", 0, error=result.error, elapsed=result.elapsed)
                        return result

        except (ClientError, asyncio.TimeoutError, ValueError, ConnectionError, OSError) as e:
            result.error = str(e)
            result.elapsed = time.time() - start_time
            if not GUI_MODE:
                print(f"[{index}/{total}] ❌ 异常: {str(e)[:100]}")
            emit_task_update(index, url, title, "failed", 0, error=result.error, elapsed=result.elapsed)
            return result

    result.elapsed = time.time() - start_time
    return result


async def process_batch(
    batch: List[tuple],
    semaphore: asyncio.Semaphore,
    client: AsyncFirecrawl,
    total: int
) -> List[ScrapeResult]:
    """
    处理一批文章

    Args:
        batch: 待处理的文章批次
        semaphore: 并发控制信号量
        client: Firecrawl 客户端
        total: 总文章数

    Returns:
        本批次的爬取结果列表
    """
    tasks = [
        scrape_single_article(semaphore, client, index, title, url, total, OUTPUT_DIR)
        for index, title, url in batch
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results


async def process_articles_in_batches(
    pending_articles: List[tuple],
    semaphore: asyncio.Semaphore,
    client: AsyncFirecrawl,
    total: int
) -> AsyncIterator[tuple[int, ScrapeResult | Exception]]:
    """
    分批处理文章，使用生成器降低内存峰值

    Args:
        pending_articles: 待处理文章列表
        semaphore: 并发控制信号量
        client: Firecrawl 客户端
        total: 总文章数

    Yields:
        (批次索引, 结果) 元组
    """
    global _stop_requested

    for batch_start in range(0, len(pending_articles), BATCH_SIZE):
        if _stop_requested:
            break

        batch_end = min(batch_start + BATCH_SIZE, len(pending_articles))
        batch = pending_articles[batch_start:batch_end]

        batch_results = await process_batch(batch, semaphore, client, total)

        for i, result in enumerate(batch_results):
            yield (batch_start + i, result)

        # 批次间短暂休息，让系统有时间释放资源
        if batch_end < len(pending_articles):
            await asyncio.sleep(0.1)


async def main_async():
    """异步主函数"""
    global _stop_requested

    start_time_total = time.time()

    # 创建输出目录
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

    if not GUI_MODE:
        print(f"输出目录: {OUTPUT_DIR}")
        print(f"Firecrawl URL: {FIRECRAWL_URL}")
        print(f"最大并发数: {MAX_CONCURRENT}")
        print(f"批次大小: {BATCH_SIZE}")
        print(f"请求超时: {REQUEST_TIMEOUT}s")
        print("=" * 70)

    # 检查文章列表文件是否存在
    if not os.path.exists(ARTICLES_FILE):
        error_msg = f"找不到文章列表文件 {ARTICLES_FILE}"
        if GUI_MODE:
            emit_json({"type": "error", "message": error_msg})
        else:
            print(f"❌ 错误: {error_msg}")
            print("请先运行 playwright 脚本来提取文章列表")
        return

    # 异步加载文章列表
    try:
        articles = await load_articles_async()
    except (ValueError, json.JSONDecodeError) as e:
        error_msg = str(e)
        if GUI_MODE:
            emit_json({"type": "error", "message": error_msg})
        else:
            print(f"❌ 错误: {e}")
        return

    total = len(articles)

    if not GUI_MODE:
        print(f"总共需要爬取 {total} 篇文章\n")

    # 异步检查已存在的文件
    existing_indices = await get_existing_indices(Path(OUTPUT_DIR))
    existing_count = len(existing_indices)

    # 准备待爬取文章列表
    pending_articles = [
        (i + 1, article['title'], article['url'])
        for i, article in enumerate(articles)
        if (i + 1) not in existing_indices
    ]

    if not GUI_MODE:
        if existing_count > 0:
            print(f"检测到已有 {existing_count} 篇文章，剩余 {len(pending_articles)} 篇待爬取")
        print(f"实际需要爬取: {len(pending_articles)} 篇文章")
        print("=" * 70)

    if not pending_articles:
        if GUI_MODE:
            emit_complete(total, existing_count, 0, 0, [])
        else:
            print("所有文章已存在，无需爬取！")
        return

    # 发送初始进度
    emit_progress(
        total=len(pending_articles),
        completed=0,
        success=0,
        failed=0,
        pending=len(pending_articles),
        running=0
    )

    # 创建信号量限制并发数
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    # 创建共享的 AsyncFirecrawl 客户端，使用 try/finally 确保资源释放
    client = AsyncFirecrawl(
        api_key=FIRECRAWL_API_KEY,
        api_url=FIRECRAWL_URL
    )

    try:
        # 统计信息
        success_count = 0
        failed_count = 0
        results_for_report: List[ScrapeResult] = []
        failed_tasks_for_gui: List[dict] = []

        if not GUI_MODE:
            print(f"\n开始异步并发爬取 (最大并发: {MAX_CONCURRENT}, 分批大小: {BATCH_SIZE})...\n")

        # 分批处理文章
        processed = 0
        async for idx, result in process_articles_in_batches(pending_articles, semaphore, client, total):
            if _stop_requested:
                break

            processed += 1

            if isinstance(result, Exception):
                failed_count += 1
                if not GUI_MODE:
                    print(f"[{idx + 1}] ❌ 异常: {str(result)[:100]}")
            elif isinstance(result, ScrapeResult):
                if result.success:
                    success_count += 1
                else:
                    failed_count += 1
                    results_for_report.append(result)
                    failed_tasks_for_gui.append({
                        "index": result.index,
                        "url": result.url,
                        "title": result.title,
                        "error": result.error or "Unknown error"
                    })
            else:
                failed_count += 1

            # 计算预计剩余时间
            elapsed_total = time.time() - start_time_total
            remaining = len(pending_articles) - processed
            eta = (elapsed_total / processed * remaining) if processed > 0 else None

            # 发送进度更新
            emit_progress(
                total=len(pending_articles),
                completed=processed,
                success=success_count,
                failed=failed_count,
                pending=remaining,
                running=min(MAX_CONCURRENT, remaining),
                eta=eta
            )

            # 显示进度（非 GUI 模式）
            if not GUI_MODE and (processed % 5 == 0 or processed == len(pending_articles)):
                print(f"\n{'=' * 70}")
                print(f"进度: {processed}/{len(pending_articles)} ({processed/len(pending_articles)*100:.1f}%)")
                print(f"本轮成功: {success_count} | 失败: {failed_count}")
                if processed > 0:
                    print(f"总用时: {elapsed_total:.1f}s | 预计总用时: {elapsed_total/processed*len(pending_articles):.1f}s")
                print(f"{'=' * 70}\n")

    finally:
        # 确保客户端资源被释放
        if hasattr(client, 'close') and callable(client.close):
            try:
                await client.close()
            except Exception:
                pass
        elif hasattr(client, '_client') and hasattr(client._client, 'close'):
            try:
                await client._client.close()
            except Exception:
                pass

    # 最终统计
    total_time = time.time() - start_time_total

    # 发送完成通知
    emit_complete(
        total=len(pending_articles),
        success=success_count,
        failed=failed_count,
        elapsed=total_time,
        failedTasks=failed_tasks_for_gui
    )

    if not GUI_MODE:
        print("\n" + "=" * 70)
        print("异步爬取完成！")
        print("=" * 70)
        print(f"总文章数: {total}")
        print(f"之前已成功: {existing_count}")
        print(f"本轮成功: {success_count}")
        print(f"本轮失败: {failed_count}")
        print(f"总用时: {total_time:.1f}秒")
        print(f"平均用时: {total_time/max(len(pending_articles), 1):.2f}秒/篇")
        print(f"最大并发数: {MAX_CONCURRENT}")
        print(f"输出目录: {OUTPUT_DIR}")

        # 显示失败的文章
        if results_for_report:
            print(f"\n失败的链接 ({len(results_for_report)}):")
            for item in results_for_report:
                print(f"  [{item.index}] {item.title[:60]}...")
                print(f"      {item.url}")
                print(f"      错误: {item.error[:100] if item.error else '未知错误'}")

        print("\n✅ 异步爬取完成！")


def main():
    """主函数 - asyncio版本"""
    # 设置信号处理器
    setup_signal_handlers()

    if not GUI_MODE:
        print(f"⚙️  配置:")
        print(f"  • 最大并发数: {MAX_CONCURRENT}")
        print(f"  • 批次大小: {BATCH_SIZE}")
        print(f"  • 重试次数: {RETRY_COUNT}")
        print(f"  • 请求超时: {REQUEST_TIMEOUT}s")
        print(f"  • 输出目录: {OUTPUT_DIR}")

    # 运行异步主函数
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
