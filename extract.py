import os
import glob
from PIL import Image

media_dir = "/Users/anitayan/.gemini/antigravity/brain/403ae4c8-a7c4-48b4-ac2a-0bf7904658f2/.tempmediaStorage/"
files = glob.glob(media_dir + "*.png")
files.sort(key=os.path.getmtime, reverse=True)

# Latest 7 mockups
target_files = files[:7]

def get_bounding_box(img):
    # Find the bounding box of the main image on the left side
    # The background is roughly (241, 239, 233) or similar.
    # Let's crop to the left 60% of the image first
    width, height = img.size
    
    # We will look for pixels that are significantly different from the top-left background pixel
    bg_color = img.getpixel((10, 10))
    
    # We'll just scan to find the bounding box of non-background pixels in the left half
    left = width
    right = 0
    top = height
    bottom = 0
    
    pixels = img.load()
    
    for y in range(0, height):
        for x in range(0, int(width * 0.7)):
            r, g, b = pixels[x, y][:3]
            # Simple threshold for background difference
            if abs(r - bg_color[0]) > 10 or abs(g - bg_color[1]) > 10 or abs(b - bg_color[2]) > 10:
                # Ignore the text at the top and bottom
                if y < height * 0.15 or y > height * 0.85:
                    continue
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y
                
    return (left, top, right, bottom)

for f in target_files:
    print(f"Processing {os.path.basename(f)}")
    img = Image.open(f).convert("RGB")
    box = get_bounding_box(img)
    print(f"Bounding box: {box}")
    
    if box[2] > box[0] and box[3] > box[1]:
        cropped = img.crop(box)
        # We need to determine which state this is. We'll just save them sequentially for now
        # so we can inspect them.
        cropped.save(f"cropped_{os.path.basename(f)}")
    else:
        print("Could not find bounding box")
