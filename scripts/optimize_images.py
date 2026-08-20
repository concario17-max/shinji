"""
237장 학습만화 이미지 초고속 WebP 변환 및 썸네일 생성 스크립트
"""

import os
import sys
import time
from PIL import Image

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_dir = os.path.join(base_dir, '새 폴더')
    dst_full_dir = os.path.join(base_dir, 'images', 'stories')
    dst_thumb_dir = os.path.join(dst_full_dir, 'thumbs')

    os.makedirs(dst_full_dir, exist_ok=True)
    os.makedirs(dst_thumb_dir, exist_ok=True)

    png_files = [f for f in os.listdir(src_dir) if f.lower().endswith('.png')]
    png_files.sort()

    print(f"Total PNG files to optimize: {len(png_files)}")
    start_time = time.time()

    total_orig_size = 0
    total_full_webp_size = 0
    total_thumb_webp_size = 0

    for i, fname in enumerate(png_files, 1):
        num_part = os.path.splitext(fname)[0] # e.g. '001'
        src_path = os.path.join(src_dir, fname)
        full_webp_path = os.path.join(dst_full_dir, f"{num_part}.webp")
        thumb_webp_path = os.path.join(dst_thumb_dir, f"{num_part}.webp")

        orig_size = os.path.getsize(src_path)
        total_orig_size += orig_size

        with Image.open(src_path) as img:
            # 1. Full resolution WebP (quality 83)
            img.save(full_webp_path, 'WEBP', quality=83, method=6)
            total_full_webp_size += os.path.getsize(full_webp_path)

            # 2. Thumbnail WebP (width 450px, quality 78)
            thumb = img.copy()
            thumb.thumbnail((450, 680), Image.Resampling.LANCZOS)
            thumb.save(thumb_webp_path, 'WEBP', quality=78, method=6)
            total_thumb_webp_size += os.path.getsize(thumb_webp_path)

        if i % 30 == 0 or i == len(png_files):
            print(f"Progress: {i}/{len(png_files)} ({i*100//len(png_files)}%)")

    # Clean up old .png files in images/stories if any
    removed_png = 0
    for f in os.listdir(dst_full_dir):
        if f.lower().endswith('.png'):
            os.remove(os.path.join(dst_full_dir, f))
            removed_png += 1

    elapsed = time.time() - start_time
    print(f"\nOptimization completed in {elapsed:.1f}s!")
    print(f"Original PNG total: {total_orig_size / (1024*1024):.1f} MB")
    print(f"Full WebP total: {total_full_webp_size / (1024*1024):.1f} MB ({(1 - total_full_webp_size/total_orig_size)*100:.1f}% reduction)")
    print(f"Thumb WebP total: {total_thumb_webp_size / (1024*1024):.1f} MB ({(1 - total_thumb_webp_size/total_orig_size)*100:.1f}% reduction)")
    print(f"Cleaned up {removed_png} old PNGs from images/stories/")

if __name__ == '__main__':
    main()
