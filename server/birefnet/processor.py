import os
import numpy as np
import torch
import torchvision.transforms as transforms
from PIL import Image
import requests
from io import BytesIO
from transformers import AutoModelForImageSegmentation

class BiRefNetProcessor:
    def __init__(self, use_gpu=False):
        self.device = torch.device("cuda" if torch.cuda.is_available() and use_gpu else "cpu")
        print(f"BiRefNetProcessor: Device set to {self.device}")
        
        # Try loading the model with transformers
        try:
            print("Loading BiRefNet model from HuggingFace with transformers...")
            self.model = AutoModelForImageSegmentation.from_pretrained(
                "zhengpeng7/BiRefNet", 
                trust_remote_code=True
            ).to(self.device)
            
            # Use half precision for faster processing if on GPU
            if self.device.type == "cuda":
                self.model = self.model.half()
                print("BiRefNet: Using half precision for faster processing")
                
            self.model.eval()
            print("BiRefNet model loaded successfully!")
        except Exception as e:
            print(f"Error loading BiRefNet model: {str(e)}")
            raise RuntimeError(f"Failed to load BiRefNet model: {str(e)}")
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((1024, 1024)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def process_image(self, img):
        """Process an image to remove the background using BiRefNet."""
        # Handle different input types
        if isinstance(img, str):
            # Load from path
            if img.startswith(('http://', 'https://')):
                response = requests.get(img)
                img = Image.open(BytesIO(response.content)).convert('RGB')
            else:
                img = Image.open(img).convert('RGB')
        elif not isinstance(img, Image.Image):
            raise ValueError("Input should be a PIL Image, a file path, or a URL")
        
        # Ensure image is RGB
        if img.mode != "RGB":
            img = img.convert("RGB")
        
        # Save original dimensions
        original_size = img.size
        
        # Prepare input
        input_tensor = self.transform(img).unsqueeze(0).to(self.device)
        
        # Convert to half precision if on CUDA
        if self.device.type == "cuda":
            input_tensor = input_tensor.half()
        
        # Run inference
        with torch.no_grad():
            # Get prediction
            preds = self.model(input_tensor)[-1]
            # Apply sigmoid to get probability map
            preds = torch.sigmoid(preds).cpu()
        
        # Get the mask
        pred = preds[0].squeeze()
        
        # Convert to PIL Image
        pred_pil = transforms.ToPILImage()(pred)
        
        # Resize to original image size
        mask = pred_pil.resize(original_size, Image.BILINEAR)
        
        # Create result with transparent background
        result = img.copy()
        result.putalpha(mask)
        
        return result
    
    def __call__(self, img):
        return self.process_image(img)