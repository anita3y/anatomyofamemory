import glob
import os
from PIL import Image

media_dir = '/Users/anitayan/.gemini/antigravity/brain/403ae4c8-a7c4-48b4-ac2a-0bf7904658f2/.tempmediaStorage/'
files = glob.glob(media_dir + '*.png')
files.sort(key=lambda x: os.path.getmtime(x), reverse=True)

# The crop box:
box = (50, 260, 1600, 1100)

mapping = {
    0: "base2.png", # Remove set the table
    1: "atmosphere.png",
    2: "food.png",
    3: "base.png",
    4: "atmosphere_food.png",
    5: "atmosphere_food_people.png",
    6: "atmosphere_food_people_music.png"
}

for i in range(7):
    img = Image.open(files[i]).convert('RGB')
    cropped = img.crop(box)
    cropped.save(f"/Users/anitayan/anatomy-of-a-memory/{mapping[i]}")
    print(f"Saved {mapping[i]} from {os.path.basename(files[i])}")
