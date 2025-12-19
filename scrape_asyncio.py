
"""
文章异步爬虫
使用 asyncio+Firecrawl 实现异步并发爬取
"""

import json
import os
import sys
import time
import asyncio
from pathlib import Path
from firecrawl import AsyncFirecrawl
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict, Optional
from aiohttp import ClientError

# 配置
FIRECRAWL_URL = "http://localhost:8547"  # 本地部署的Firecrawl
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR
ARTICLES_FILE = BASE_DIR / "cbre_data_center_articles.json"

# 并发配置
MAX_CONCURRENT = 15  # 推荐值: 2×CPU核心数 = 16
SEMAPHORE_LIMIT = 15  # 信号量限制，控制同时进行的任务数
RETRY_COUNT = 3  # 失败重试次数
RETRY_DELAY = 2.0  # 重试延迟（秒）
REQUEST_TIMEOUT = 30  # 单次请求超时时间（秒，作用于每次 scrape 调用，未包含重试累计耗时）


@dataclass
class ScrapeResult:
    """爬取结果"""
    index: int
    title: str
    url: str
    success: bool
    error: Optional[str] = None
    elapsed: float = 0.0


@dataclass
class RetryContext:
    result: ScrapeResult
    start_time: float
    index: int
    total: int

    def mark_elapsed(self) -> None:
        self.result.elapsed = time.time() - self.start_time


async def handle_retry(message: str, attempt: int, is_timeout: bool, ctx: RetryContext) -> bool:
    """处理重试逻辑，返回是否继续重试；失败终止时由调用方设置结果"""
    if attempt < RETRY_COUNT - 1:
        if is_timeout:
            print(f"[{ctx.index}/{ctx.total}] 超时，第{attempt+1}次尝试失败，{RETRY_DELAY}秒后重试...")
        else:
            print(f"[{ctx.index}/{ctx.total}] 第{attempt+1}次尝试失败: {message[:100]}，{RETRY_DELAY}秒后重试...")
        await asyncio.sleep(RETRY_DELAY)
        return True

    ctx.mark_elapsed()
    if is_timeout:
        print(f"[{ctx.index}/{ctx.total}] ❌ 失败: 请求超时")
    else:
        print(f"[{ctx.index}/{ctx.total}] ❌ 失败: {message[:100]}")
    return False


def load_articles() -> List[Dict]:
    """从JSON文件加载文章列表"""
    with open(ARTICLES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['articles']


async def scrape_single_article(async_firecrawl: AsyncFirecrawl, semaphore, index: int, title: str, url: str, total: int, output_dir: str) -> ScrapeResult:
    """异步爬取单篇文章"""
    result = ScrapeResult(
        index=index,
        title=title,
        url=url,
        success=False
    )

    start_time = time.time()
    ctx = RetryContext(result=result, start_time=start_time, index=index, total=total)

    async with semaphore:
        try:
            print(f"[{index}/{total}] 开始爬取: {title[:60]}...")

            # 爬取文章（带重试）
            for attempt in range(RETRY_COUNT):
                try:
                    doc = await asyncio.wait_for(
                        async_firecrawl.scrape(
                            url,
                            formats=["markdown"],
                            only_main_content=True,
                        ),
                        timeout=REQUEST_TIMEOUT,
                    )

                    if not doc or not doc.markdown:
                        raise ValueError("无法获取内容")

                    # 创建安全的文件名
                    safe_title = "".join(
                        c for c in title
                        if c.isalnum() or c in (' ', '-', '_', '，', '。', '？', '！', '&', ':', '’', '"', "'")
                    ).rstrip()
                    safe_title = safe_title[:100]
                    filename = f"{index:03d}_{safe_title}.md"
                    filepath = Path(output_dir) / filename

                    # 写入文件
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(f"# {index}. {title}\n\n")
                        f.write(f"**URL:** {url}\n\n")
                        f.write(f"**抓取时间:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                        f.write("---\n\n")
                        f.write(doc.markdown)

                    result.success = True
                    ctx.mark_elapsed()
                    print(f"[{index}/{total}] ✓ 成功 ({result.elapsed:.1f}s): {filepath.name}")
                    return result

                except asyncio.TimeoutError:
                    should_continue = await handle_retry("请求超时", attempt, True, ctx)
                    if should_continue:
                        continue
                    result.error = "请求超时"
                    return result
                except (ClientError, Exception) as e:
                    message = str(e)
                    should_continue = await handle_retry(message, attempt, False, ctx)
                    if should_continue:
                        continue
                    result.error = message
                    return result

        except Exception as e:
            result.error = str(e)
            ctx.mark_elapsed()
            print(f"[{index}/{total}] ❌ 异常: {str(e)[:100]}")
            return result

    ctx.mark_elapsed()
    return result


async def main_async():
    """异步主函数"""
    start_time_total = time.time()

    # 创建输出目录
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"Firecrawl URL: {FIRECRAWL_URL}")
    print(f"最大并发数: {MAX_CONCURRENT}")
    print("=" * 70)

    # 加载文章列表
    if not os.path.exists(ARTICLES_FILE):
        print(f"❌ 错误: 找不到文章列表文件 {ARTICLES_FILE}")
        print("请先运行 playwright 脚本来提取文章列表")
        return

    articles = load_articles()
    total = len(articles)
    print(f"总共需要爬取 {total} 篇文章\n")

    # 检查已存在的文件
    existing_files = list(Path(OUTPUT_DIR).glob("*.md"))
    pending_articles = []

    if existing_files:
        # 获取已成功的索引
        existing_indices = set()
        for file in existing_files:
            try:
                idx = int(file.name[:3])
                existing_indices.add(idx)
            except:
                pass

        # 过滤掉已成功的文章
        for i, article in enumerate(articles):
            if (i+1) not in existing_indices:
                pending_articles.append((i+1, article['title'], article['url'], total, OUTPUT_DIR))

        print(f"检测到已有 {len(existing_files)} 篇文章，剩余 {len(pending_articles)} 篇待爬取")
    else:
        # 准备所有文章（添加索引）
        for i, article in enumerate(articles):
            pending_articles.append((i+1, article['title'], article['url'], total, OUTPUT_DIR))

    print(f"实际需要爬取: {len(pending_articles)} 篇文章")
    print("=" * 70)

    if not pending_articles:
        print("所有文章已存在，无需爬取！")
        return

    # 创建信号量限制并发数
    semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)

    # 初始化共享 AsyncFirecrawl 客户端
    async_firecrawl = AsyncFirecrawl(
        api_key="test",
        api_url=FIRECRAWL_URL
    )

    # 统计信息
    success_count = 0
    failed_count = 0

    print(f"\n开始异步并发爬取 (最大并发: {MAX_CONCURRENT})...\n")

    results = []
    try:
        # 创建所有异步任务
        tasks = [
            scrape_single_article(async_firecrawl, semaphore, index, title, url, total, OUTPUT_DIR)
            for index, title, url, _, _ in pending_articles
        ]

        # 并发执行所有任务
        results = await asyncio.gather(*tasks, return_exceptions=True)
    finally:
        async def _maybe_close(method) -> bool:
            if method is None or not callable(method):
                return False
            result_obj = method()
            if asyncio.iscoroutine(result_obj):
                await result_obj
            return True

        try:
            # 优先使用异步 aclose，如不存在则尝试 close
            called = await _maybe_close(getattr(async_firecrawl, "aclose", None))
            if not called:
                await _maybe_close(getattr(async_firecrawl, "close", None))
        except Exception:
            # firecrawl-py 暴露 async close；兼容可能存在同步 close/aclose 的版本或第三方实现，关闭失败不影响整体流程（此处仅提示，不中断）
            print("关闭 AsyncFirecrawl 客户端失败，已忽略。")

    for i, result in enumerate(results, 1):
        if isinstance(result, Exception):
            failed_count += 1
            print(f"[{i}] ❌ 异常: {str(result)[:100]}")
        elif isinstance(result, ScrapeResult):
            if result.success:
                success_count += 1
            else:
                failed_count += 1
        else:
            failed_count += 1

        # 显示进度
        if i % 5 == 0 or i == len(pending_articles):
            elapsed_total = time.time() - start_time_total
            print(f"\n{'=' * 70}")
            print(f"进度: {i}/{len(pending_articles)} ({i/len(pending_articles)*100:.1f}%)")
            print(f"本轮成功: {success_count} | 失败: {failed_count}")
            print(f"总用时: {elapsed_total:.1f}s | 预计总用时: {elapsed_total/i*len(pending_articles):.1f}s")
            print(f"{'=' * 70}\n")

    # 最终统计
    total_time = time.time() - start_time_total
    final_success = len(existing_files) + success_count

    print("\n" + "=" * 70)
    print("异步爬取完成！")
    print("=" * 70)
    print(f"总文章数: {total}")
    print(f"之前已成功: {len(existing_files)}")
    print(f"本轮成功: {success_count}")
    print(f"本轮失败: {failed_count}")
    print(f"总用时: {total_time:.1f}秒")
    print(f"平均用时: {total_time/total:.2f}秒/篇")
    print(f"最大并发数: {MAX_CONCURRENT}")
    print(f"输出目录: {OUTPUT_DIR}")

    # 显示失败的文章
    failed_articles = [r for r in results if isinstance(r, ScrapeResult) and not r.success]
    if failed_articles:
        print(f"\n失败的链接 ({len(failed_articles)}):")
        for item in failed_articles:
            print(f"  [{item.index}] {item.title[:60]}...")
            print(f"      {item.url}")
            print(f"      错误: {item.error[:100] if item.error else '未知错误'}")

    print("\n✅ 异步爬取完成！")


def main():
    """主函数 - asyncio版本"""

    print(f"⚙️  配置:")
    print(f"  • 最大并发数: {MAX_CONCURRENT}")
    print(f"  • 重试次数: {RETRY_COUNT}")
    print(f"  • 输出目录: {OUTPUT_DIR}")  

    # 运行异步主函数
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
