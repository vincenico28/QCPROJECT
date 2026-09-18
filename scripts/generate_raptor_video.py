"""
generate_raptor_video.py
------------------------
Generates a photorealistic, high-definition traffic surveillance video of a
Black Ford Raptor (Plate: NBA-1121) committing a Red Light Crossing violation
at a Quezon City intersection.

Output:
  - public/videos/ford_raptor_red_light.mp4
  - public/videos/ford_raptor_red_light_poster.jpg
  - scripts/ford_raptor_red_light.mp4
"""

import os
import sys
import math
import time
import subprocess
import cv2
import numpy as np

# Path configurations
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_SCENE_PATH = r"C:\Users\Nico\.gemini\antigravity-ide\brain\33bdf1e1-de08-40f5-a072-d18abfe2831e\ford_raptor_red_light_scene_1789624257493.jpg"
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "public", "videos")
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "ford_raptor_red_light.mp4")
OUTPUT_POSTER = os.path.join(OUTPUT_DIR, "ford_raptor_red_light_poster.jpg")
LOCAL_MP4 = os.path.join(WORKSPACE_DIR, "scripts", "ford_raptor_red_light.mp4")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.join(WORKSPACE_DIR, "scripts"), exist_ok=True)


def get_ffmpeg_path():
    """Retrieves ffmpeg executable from imageio-ffmpeg or system PATH."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def create_crisp_philippine_plate(width=160, height=52, plate_text="NBA 1121"):
    """
    Renders an authentic, high-resolution Philippine LTO license plate graphic.
    - White reflective background
    - Crisp dark green / black border
    - "PILIPINAS" header with Rizal monument seal
    - Bold embossed plate font "NBA 1121"
    """
    plate = np.ones((height, width, 3), dtype=np.uint8) * 248

    # Border
    cv2.rectangle(plate, (1, 1), (width - 2, height - 2), (20, 20, 20), 2)
    cv2.rectangle(plate, (3, 3), (width - 4, height - 4), (220, 220, 220), 1)

    # Header: "PILIPINAS"
    cv2.putText(
        plate,
        "PILIPINAS",
        (int(width * 0.32), int(height * 0.24)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.32,
        (40, 80, 40),
        1,
        cv2.LINE_AA,
    )

    # Main Plate Number (NBA 1121)
    font_scale = 0.85
    thickness = 2
    (tw, th), _ = cv2.getTextSize(plate_text, cv2.FONT_HERSHEY_DUPLEX, font_scale, thickness)
    tx = int((width - tw) / 2)
    ty = int(height * 0.72)

    # Drop shadow for embossed look
    cv2.putText(
        plate,
        plate_text,
        (tx + 1, ty + 1),
        cv2.FONT_HERSHEY_DUPLEX,
        font_scale,
        (120, 120, 120),
        thickness,
        cv2.LINE_AA,
    )
    # Crisp black text
    cv2.putText(
        plate,
        plate_text,
        (tx, ty),
        cv2.FONT_HERSHEY_DUPLEX,
        font_scale,
        (10, 10, 10),
        thickness,
        cv2.LINE_AA,
    )

    # Region label at bottom: "NCR"
    cv2.putText(
        plate,
        "NCR",
        (int(width * 0.44), int(height * 0.94)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.24,
        (60, 60, 60),
        1,
        cv2.LINE_AA,
    )

    return plate


def prepare_raptor_sprite(scene_img):
    """
    Extracts the Black Ford Raptor from the scene, cleans its alpha silhouette,
    and applies a crisp, ultra-clear NBA-1121 front license plate.
    """
    h, w = scene_img.shape[:2]
    # Coordinates of Raptor in the 1376x768 reference scene
    rx1, ry1, rx2, ry2 = 610, 360, 960, 630
    raptor_crop = scene_img[ry1:ry2, rx1:rx2].copy()
    ch, cw = raptor_crop.shape[:2]

    # Segment vehicle using GrabCut with iterative refinement
    mask = np.zeros((ch, cw), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    rect = (10, 5, cw - 20, ch - 10)
    cv2.grabCut(raptor_crop, mask, rect, bgd_model, fgd_model, 4, cv2.GC_INIT_WITH_RECT)

    # Clean binary alpha mask with soft edges
    fg_mask = np.where((mask == 1) | (mask == 3), 255, 0).astype("uint8")
    # Clean up bottom shadow contact
    fg_mask[int(ch * 0.94):, :] = 0
    fg_mask = cv2.GaussianBlur(fg_mask, (5, 5), 0)

    # Mount the high-definition NBA-1121 plate onto the front bumper
    plate_w = 64
    plate_h = 24
    plate_img = create_crisp_philippine_plate(plate_w, plate_h, "NBA-1121")

    # Front bumper plate center in raptor crop
    px = int(cw * 0.52 - plate_w / 2)
    py = int(ch * 0.77 - plate_h / 2)
    raptor_crop[py : py + plate_h, px : px + plate_w] = plate_img

    # Build BGRA sprite
    raptor_bgra = cv2.cvtColor(raptor_crop, cv2.COLOR_BGR2BGRA)
    raptor_bgra[:, :, 3] = fg_mask

    return raptor_bgra


def prepare_clean_background(scene_img):
    """
    Reconstructs the empty intersection road markings (yellow box, zebra crosswalk)
    so the Raptor can realistically drive through the intersection without leaving ghosts.
    """
    h, w = scene_img.shape[:2]
    bg = scene_img.copy()

    # Inpaint vehicle area
    inpaint_mask = np.zeros((h, w), dtype=np.uint8)
    inpaint_mask[360:635, 605:965] = 255
    bg = cv2.inpaint(bg, inpaint_mask, 7, cv2.INPAINT_TELEA)

    # Re-draw crisp yellow box diagonal junction lines
    # Yellow box bounds: (200, 320) to (1100, 480)
    yellow_color = (70, 180, 220)  # BGR yellow/gold
    cv2.line(bg, (200, 320), (1100, 480), yellow_color, 4, cv2.LINE_AA)
    cv2.line(bg, (1100, 320), (200, 480), yellow_color, 4, cv2.LINE_AA)
    cv2.line(bg, (200, 480), (1100, 480), yellow_color, 5, cv2.LINE_AA)

    # Re-draw pedestrian zebra crosswalk stripes (white)
    white_color = (235, 235, 235)
    for sx in range(480, 920, 42):
        pts = np.array(
            [
                [sx, 485],
                [sx + 24, 485],
                [sx - 15, 615],
                [sx - 42, 615],
            ],
            np.int32,
        )
        cv2.fillPoly(bg, [pts], white_color)

    # Ensure overhead traffic light has a glowing RED beacon
    # Top lamp: center around (796, 75)
    cv2.circle(bg, (796, 75), 26, (0, 0, 255), -1, cv2.LINE_AA)
    cv2.circle(bg, (796, 75), 32, (0, 50, 255), 3, cv2.LINE_AA)
    cv2.circle(bg, (796, 75), 45, (0, 30, 180), 2, cv2.LINE_AA)
    # Bright inner core
    cv2.circle(bg, (796, 75), 14, (120, 180, 255), -1, cv2.LINE_AA)

    # Turn OFF middle (yellow) and bottom (green) lamps
    cv2.circle(bg, (796, 125), 20, (15, 20, 20), -1, cv2.LINE_AA)
    cv2.circle(bg, (796, 175), 20, (15, 25, 20), -1, cv2.LINE_AA)

    return bg


def overlay_sprite(bg_img, sprite_bgra, center_x, center_y, scale):
    """Overlays an alpha sprite onto the background at (center_x, center_y) with scaling."""
    sh, sw = sprite_bgra.shape[:2]
    nw = max(10, int(sw * scale))
    nh = max(10, int(sh * scale))

    resized_sprite = cv2.resize(sprite_bgra, (nw, nh), interpolation=cv2.INTER_LINEAR)
    x1 = int(center_x - nw / 2)
    y1 = int(center_y - nh / 2)
    x2 = x1 + nw
    y2 = y1 + nh

    bh, bw = bg_img.shape[:2]
    # Clipping
    sx1 = max(0, -x1)
    sy1 = max(0, -y1)
    sx2 = nw - max(0, x2 - bw)
    sy2 = nh - max(0, y2 - bh)

    dx1 = max(0, x1)
    dy1 = max(0, y1)
    dx2 = min(bw, x2)
    dy2 = min(bh, y2)

    if dx2 <= dx1 or dy2 <= dy1 or sx2 <= sx1 or sy2 <= sy1:
        return bg_img

    alpha = resized_sprite[sy1:sy2, sx1:sx2, 3] / 255.0
    alpha_3d = np.dstack([alpha, alpha, alpha])
    sprite_bgr = resized_sprite[sy1:sy2, sx1:sx2, :3]

    # Ground contact shadow
    shadow_h = int(nh * 0.16)
    shadow_w = int(nw * 0.88)
    shadow_mask = np.zeros((bh, bw), dtype=np.uint8)
    sh_x = int(center_x)
    sh_y = int(y2 - shadow_h * 0.3)
    cv2.ellipse(
        shadow_mask,
        (sh_x, sh_y),
        (int(shadow_w / 2), int(shadow_h / 2)),
        0,
        0,
        360,
        140,
        -1,
    )
    shadow_mask = cv2.GaussianBlur(shadow_mask, (21, 21), 0)
    shadow_alpha = (shadow_mask / 255.0 * 0.65)[:, :, np.newaxis]
    bg_img = (bg_img * (1.0 - shadow_alpha)).astype(np.uint8)

    # Alpha composite
    roi = bg_img[dy1:dy2, dx1:dx2].astype(np.float32)
    composite = sprite_bgr.astype(np.float32) * alpha_3d + roi * (1.0 - alpha_3d)
    bg_img[dy1:dy2, dx1:dx2] = composite.astype(np.uint8)

    return bg_img


def draw_cctv_hud(frame, frame_idx, fps, start_timestamp):
    """Draws official Quezon City DPOS CCTV Surveillance OSD overlay."""
    h, w = frame.shape[:2]
    cur_time = time.strftime(
        "%Y-%m-%d %H:%M:%S",
        time.localtime(start_timestamp + frame_idx / float(fps)),
    )

    # Top-left CCTV Header
    hud_bg_w = 420
    cv2.rectangle(frame, (10, 10), (hud_bg_w, 70), (0, 0, 0), -1)
    cv2.rectangle(frame, (10, 10), (hud_bg_w, 70), (40, 180, 40), 1)

    cv2.putText(
        frame,
        "QC-DPOS TRAFFIC SENTRY | CAM-042 [LIVE]",
        (20, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.48,
        (0, 255, 128),
        1,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        f"TIMESTAMP: {cur_time}.{int((frame_idx % fps) / fps * 100):02d} UTC+8",
        (20, 52),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.42,
        (220, 220, 220),
        1,
        cv2.LINE_AA,
    )

    # Top-right REC indicator
    cv2.rectangle(frame, (w - 180, 10), (w - 10, 45), (0, 0, 0), -1)
    # Blinking red dot
    if (frame_idx // 15) % 2 == 0:
        cv2.circle(frame, (w - 155, 28), 6, (0, 0, 255), -1, cv2.LINE_AA)
    cv2.putText(
        frame,
        "REC  60.0 FPS",
        (w - 140, 33),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.46,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )

    return frame


def generate_video():
    print("=" * 70)
    print("🎬 QUEZON CITY TRAFFIC AI - BLACK FORD RAPTOR TEST VIDEO GENERATOR")
    print("=" * 70)

    # Check base scene image
    if not os.path.exists(BASE_SCENE_PATH):
        print(f"❌ Error: Base image not found at: {BASE_SCENE_PATH}")
        sys.exit(1)

    print(f"📸 Loading base scene: {BASE_SCENE_PATH}...")
    scene_img = cv2.imread(BASE_SCENE_PATH)
    if scene_img is None:
        print("❌ Could not decode base image.")
        sys.exit(1)

    h, w = scene_img.shape[:2]
    print(f"📐 Scene resolution: {w}x{h}")

    print("✂️ Isolating Black Ford Raptor & mounting NBA-1121 plate...")
    raptor_sprite = prepare_raptor_sprite(scene_img)

    print("🛣️ Reconstructing clean intersection background...")
    clean_bg = prepare_clean_background(scene_img)

    # Save clean poster
    poster_frame = overlay_sprite(clean_bg.copy(), raptor_sprite, 785, 494, 1.0)
    poster_frame = draw_cctv_hud(poster_frame, 0, 30, time.time())
    cv2.imwrite(OUTPUT_POSTER, poster_frame)
    print(f"🖼️ Poster saved to: {OUTPUT_POSTER}")

    # Video Parameters
    fps = 30
    duration_sec = 8.0
    total_frames = int(fps * duration_sec)
    start_time = time.time()

    print(f"🎥 Rendering {total_frames} frames ({duration_sec}s @ {fps}fps)...")

    # Animation Trajectory (Approach -> Red Light Crossing -> Pass Camera)
    # Start: behind stop line at the top of intersection
    # Crossing the stop line at Y ~ 480
    # End: passing bottom of screen
    temp_raw_avi = os.path.join(WORKSPACE_DIR, "scripts", "temp_raw.avi")
    fourcc = cv2.VideoWriter_fourcc(*"MJPG")
    out = cv2.VideoWriter(temp_raw_avi, fourcc, fps, (w, h))

    for idx in range(total_frames):
        t = idx / float(total_frames)  # 0.0 to 1.0

        # Phase timing:
        # 0.00 - 0.20: Raptor approaching intersection (behind yellow box, y: 310 -> 380)
        # 0.20 - 0.70: Raptor crossing RED light stop line & zebra walk (y: 380 -> 640)
        # 0.70 - 1.00: Raptor accelerating out of intersection (y: 640 -> 920)
        if t < 0.20:
            sub_t = t / 0.20
            # Ease in
            cur_y = 310 + (380 - 310) * (sub_t ** 1.4)
            cur_x = 730 + (760 - 730) * sub_t
            scale = 0.58 + (0.75 - 0.58) * sub_t
        elif t < 0.70:
            sub_t = (t - 0.20) / 0.50
            # Steady acceleration through red light
            cur_y = 380 + (640 - 380) * (sub_t ** 1.1)
            cur_x = 760 + (800 - 760) * sub_t
            scale = 0.75 + (1.15 - 0.75) * sub_t
        else:
            sub_t = (t - 0.70) / 0.30
            # High speed exit
            cur_y = 640 + (920 - 640) * (sub_t ** 1.3)
            cur_x = 800 + (840 - 800) * sub_t
            scale = 1.15 + (1.65 - 1.15) * sub_t

        frame = clean_bg.copy()
        frame = overlay_sprite(frame, raptor_sprite, int(cur_x), int(cur_y), scale)
        frame = draw_cctv_hud(frame, idx, fps, start_time)

        out.write(frame)

        if idx % 30 == 0 or idx == total_frames - 1:
            print(f"   Frame {idx+1}/{total_frames} ({(idx+1)/total_frames*100:.1f}%) | Raptor Y={int(cur_y)} Scale={scale:.2f}")

    out.release()
    print("✅ Raw video frames rendered!")

    # Convert to ultra-compatible H.264 MP4 using bundled ffmpeg
    ffmpeg_exe = get_ffmpeg_path()
    print(f"📦 Compressing to pristine H.264 MP4 using {ffmpeg_exe}...")

    cmd_public = [
        ffmpeg_exe,
        "-y",
        "-i",
        temp_raw_avi,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        OUTPUT_MP4,
    ]

    subprocess.run(cmd_public, check=True)
    print(f"🎉 Public Video Ready: {OUTPUT_MP4}")

    # Copy to local scripts folder too
    import shutil
    shutil.copyfile(OUTPUT_MP4, LOCAL_MP4)
    print(f"🎉 Local Video Ready: {LOCAL_MP4}")

    # Clean up temp raw avi
    if os.path.exists(temp_raw_avi):
        os.remove(temp_raw_avi)

    size_mb = os.path.getsize(OUTPUT_MP4) / (1024 * 1024)
    print("=" * 70)
    print(f"✨ SUCCESS: Ford Raptor Red Light Crossing Test Video Generated!")
    print(f"   📁 File: {OUTPUT_MP4}")
    print(f"   💾 Size: {size_mb:.2f} MB")
    print(f"   ⏱️ Duration: {duration_sec}s ({total_frames} frames @ {fps}fps)")
    print(f"   🚘 Vehicle: Black Ford Raptor")
    print(f"   🪪 Plate Number: NBA-1121")
    print(f"   🚦 Offense: Red Light Crossing")
    print("=" * 70)


if __name__ == "__main__":
    generate_video()
