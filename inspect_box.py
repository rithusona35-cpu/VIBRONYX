from ultralytics import YOLO

m = YOLO("d:/SIH/anband told/models/best_model.pt")
res = m.val(data="d:/SIH/anband told/leakage_free_dataset/data.yaml", split="val", imgsz=800, batch=16, conf=0.25, verbose=False)
print("mp:", res.box.mp)
print("mr:", res.box.mr)
print("map50:", res.box.map50)
print("map:", res.box.map)
print("ap50:", res.box.ap50)
print("p:", res.box.p)
print("r:", res.box.r)
print("f1:", res.box.f1)
print("curves:", getattr(res.box, "curves", None))
print("curves_results:", getattr(res.box, "curves_results", None))
