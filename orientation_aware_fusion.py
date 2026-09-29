"""
MineGuard AI — Orientation-Aware Multi-View Detection Fusion & Coordinate Transformation
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Any, Optional

def transform_bbox_to_original(
    bbox: List[float],
    orientation: int,
    orig_w: int,
    orig_h: int
) -> List[float]:
    """
    Transforms bounding box coordinates [x1, y1, x2, y2] from a rotated frame
    back into the original (unrotated) image coordinate space.
    
    Args:
        bbox: [x1, y1, x2, y2] in the rotated image coordinate system.
        orientation: Rotation angle applied to original image in degrees clockwise (0, 90, 180, 270).
        orig_w: Original image width in pixels.
        orig_h: Original image height in pixels.
        
    Returns:
        [x1, y1, x2, y2] clamped and verified in original image coordinate space.
    """
    x1, y1, x2, y2 = [float(v) for v in bbox]
    
    if orientation == 0:
        ox1, oy1, ox2, oy2 = x1, y1, x2, y2
    elif orientation == 90:
        # Rotated 90 deg CW: W_rot = orig_h, H_rot = orig_w
        # x_rot = orig_h - 1 - y_orig => y_orig = orig_h - 1 - x_rot
        # y_rot = x_orig => x_orig = y_rot
        ox1 = y1
        ox2 = y2
        oy1 = (orig_h - 1) - x2
        oy2 = (orig_h - 1) - x1
    elif orientation == 180:
        # Rotated 180 deg: W_rot = orig_w, H_rot = orig_h
        # x_orig = (orig_w - 1) - x_rot
        # y_orig = (orig_h - 1) - y_rot
        ox1 = (orig_w - 1) - x2
        ox2 = (orig_w - 1) - x1
        oy1 = (orig_h - 1) - y2
        oy2 = (orig_h - 1) - y1
    elif orientation == 270:
        # Rotated 270 deg CW (90 deg CCW): W_rot = orig_h, H_rot = orig_w
        # x_rot = y_orig => y_orig = x_rot
        # y_rot = orig_w - 1 - x_orig => x_orig = (orig_w - 1) - y_rot
        ox1 = (orig_w - 1) - y2
        ox2 = (orig_w - 1) - y1
        oy1 = x1
        oy2 = x2
    else:
        raise ValueError(f"Unsupported orientation angle: {orientation}. Expected 0, 90, 180, or 270.")

    # Ensure min <= max
    rx1 = min(ox1, ox2)
    rx2 = max(ox1, ox2)
    ry1 = min(oy1, oy2)
    ry2 = max(oy1, oy2)
    
    # Clamp to original image boundaries
    rx1 = max(0.0, min(float(orig_w), rx1))
    rx2 = max(0.0, min(float(orig_w), rx2))
    ry1 = max(0.0, min(float(orig_h), ry1))
    ry2 = max(0.0, min(float(orig_h), ry2))
    
    return [round(rx1, 2), round(ry1, 2), round(rx2, 2), round(ry2, 2)]

def validate_detection_geometry(
    bbox: List[float],
    orig_w: int,
    orig_h: int,
    min_area: float = 4.0
) -> bool:
    """
    Validates that a bounding box satisfies physical geometrical invariants.
    """
    x1, y1, x2, y2 = bbox
    w = x2 - x1
    h = y2 - y1
    if w <= 0 or h <= 0:
        return False
    if (w * h) < min_area:
        return False
    if x1 < 0 or y1 < 0 or x2 > orig_w or y2 > orig_h:
        return False
    return True

def compute_iou(box1: List[float], box2: List[float]) -> float:
    """Computes Intersection over Union between two bounding boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h
    
    area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    
    union_area = area1 + area2 - inter_area
    if union_area <= 0:
        return 0.0
    return inter_area / union_area

def detect_orientation_views(
    model,
    image_bgr: np.ndarray,
    angles: List[int] = [0, 90, 180, 270],
    imgsz: int = 800,
    conf: float = 0.25,
    iou: float = 0.50
) -> Dict[int, List[Dict[str, Any]]]:
    """
    Runs inference across specified rotation angles.
    """
    orig_h, orig_w = image_bgr.shape[:2]
    view_detections = {}
    
    for angle in angles:
        if angle == 0:
            view_im = image_bgr
        elif angle == 90:
            view_im = cv2.rotate(image_bgr, cv2.ROTATE_90_CLOCKWISE)
        elif angle == 180:
            view_im = cv2.rotate(image_bgr, cv2.ROTATE_180)
        elif angle == 270:
            view_im = cv2.rotate(image_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
        else:
            continue
            
        import torch
        with torch.inference_mode():
            results = model.predict(view_im, imgsz=imgsz, conf=conf, iou=iou, verbose=False)[0]
        boxes = results.boxes
        dets = []
        if len(boxes) > 0:
            for i in range(len(boxes)):
                xyxy = boxes.xyxy[i].cpu().numpy().tolist()
                c = float(boxes.conf[i].item())
                cls_id = int(boxes.cls[i].item())
                cls_name = results.names.get(cls_id, f"class_{cls_id}")
                
                # Transform coordinates immediately to original space
                orig_xyxy = transform_bbox_to_original(xyxy, angle, orig_w, orig_h)
                if validate_detection_geometry(orig_xyxy, orig_w, orig_h):
                    dets.append({
                        "bbox_original": orig_xyxy,
                        "bbox_view": [round(x, 2) for x in xyxy],
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(c, 4),
                        "view_angle": angle
                    })
        view_detections[angle] = dets
        
    return view_detections

def fuse_orientation_detections(
    all_candidates: List[Dict[str, Any]],
    orig_w: int,
    orig_h: int,
    iou_thresh: float = 0.45
) -> List[Dict[str, Any]]:
    """
    Fuses multi-view detections transformed to original image space.
    Removes spatial duplicates and retains the highest confidence detection.
    """
    if not all_candidates:
        return []
        
    # Sort candidates by confidence descending
    sorted_candidates = sorted(all_candidates, key=lambda d: d["confidence"], reverse=True)
    fused: List[Dict[str, Any]] = []
    
    for cand in sorted_candidates:
        box = cand["bbox_original"]
        cls_id = cand["class_id"]
        
        # Check against already accepted detections
        duplicate = False
        for accepted in fused:
            if accepted["class_id"] == cls_id:
                if compute_iou(box, accepted["bbox_original"]) > iou_thresh:
                    duplicate = True
                    break
        if not duplicate:
            fused.append(cand)
            
    return fused

class SmartOrientationRouter:
    """
    Deterministic Industrial Inference Router.
    - Fast Path: Normal landscape conveyor gantry image -> single inference.
    - Fallback Path: Portrait aspect ratio (H > 1.25 W) or zero detections on suspicious aspect ratios -> multi-view fusion.
    """
    def __init__(self, model, imgsz: int = 800, conf: float = 0.25, iou: float = 0.50):
        self.model = model
        self.imgsz = imgsz
        self.conf = conf
        self.iou = iou

    def infer(self, image_bgr: np.ndarray) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
        orig_h, orig_w = image_bgr.shape[:2]
        aspect_ratio = orig_w / float(orig_h)
        
        telemetry = {
            "orig_width": orig_w,
            "orig_height": orig_h,
            "aspect_ratio": round(aspect_ratio, 3),
            "fast_path_used": True,
            "fallback_reason": "NONE",
            "angles_evaluated": [0]
        }
        
        # Fast path evaluation
        fast_res = detect_orientation_views(
            self.model, image_bgr, angles=[0],
            imgsz=self.imgsz, conf=self.conf, iou=self.iou
        )[0]
        
        # If fast path yielded valid detections and image is normal landscape, return immediately
        if len(fast_res) > 0 and aspect_ratio >= 0.8:
            return fast_res, "FAST_PATH_LANDSCAPE", telemetry
            
        # Determine if Fallback Path is required
        needs_fallback = False
        reason = "NONE"
        
        if aspect_ratio < 0.75: # Extreme portrait orientation (e.g. smartphone photo 1:2.21)
            needs_fallback = True
            reason = f"EXTREME_PORTRAIT_ASPECT_RATIO (w/h={aspect_ratio:.3f})"
        elif len(fast_res) == 0 and aspect_ratio < 1.0: # Moderate portrait with 0 detections
            needs_fallback = True
            reason = f"PORTRAIT_ZERO_DETECTIONS_FALLBACK (w/h={aspect_ratio:.3f})"
            
        if not needs_fallback:
            return fast_res, "FAST_PATH_STANDARD", telemetry
            
        # Execute Fallback Path: evaluate both landscape orientations (90 CW and 270 CW / 90 CCW)
        telemetry["fast_path_used"] = False
        telemetry["fallback_reason"] = reason
        telemetry["angles_evaluated"] = [0, 90, 270]
        
        fallback_views = detect_orientation_views(
            self.model, image_bgr, angles=[90, 270],
            imgsz=self.imgsz, conf=self.conf, iou=self.iou
        )
        
        all_candidates = fast_res + fallback_views.get(90, []) + fallback_views.get(270, [])
        fused = fuse_orientation_detections(all_candidates, orig_w, orig_h, iou_thresh=self.iou)
        
        return fused, f"FALLBACK_ROUTER_ACTIVATED ({reason})", telemetry
