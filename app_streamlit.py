import streamlit as st
from ultralytics import YOLO
from PIL import Image
import numpy as np
import cv2

st.set_page_config(page_title="YOLO Object Detection", layout="wide")

st.title("🚀 YOLO Object Detection App")
st.write("Upload an image to perform object detection with your custom trained YOLO model (`best.pt`).")

@st.cache_resource
def load_model():
    return YOLO("best.pt")

model = load_model()

# Sidebar controls
st.sidebar.header("Model Settings")
conf_threshold = st.sidebar.slider("Confidence Threshold", 0.01, 1.0, 0.25, 0.01)
iou_threshold = st.sidebar.slider("IoU Threshold", 0.01, 1.0, 0.45, 0.01)

uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png", "webp"])

if uploaded_file is not None:
    image = Image.open(uploaded_file)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Uploaded Image")
        st.image(image, use_column_width=True)
        
    # Run prediction
    results = model.predict(source=image, conf=conf_threshold, iou=iou_threshold, save=False)
    res = results[0]
    
    # Plot results
    annotated_img_bgr = res.plot()
    annotated_img_rgb = cv2.cvtColor(annotated_img_bgr, cv2.COLOR_BGR2RGB)
    
    with col2:
        st.subheader("Detection Result")
        st.image(annotated_img_rgb, use_column_width=True)
        
        # Display detection summary
        boxes = res.boxes
        if len(boxes) == 0:
            st.warning("No objects detected.")
        else:
            st.success(f"Detected {len(boxes)} object(s):")
            counts = {}
            for cls_id in boxes.cls:
                class_name = res.names[int(cls_id)]
                counts[class_name] = counts.get(class_name, 0) + 1
            
            for cls_name, count in counts.items():
                st.write(f"- **{cls_name}**: {count}")
