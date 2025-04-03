#!/bin/bash

# Update package list
sudo apt update

# Install system dependencies
sudo apt update
sudo apt install -y python3-pip python3-venv pngcrush libjpeg-turbo-progs jpegoptim \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev ffmpeg

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install numpy==1.26.4 #WEIRD IMPORT ERROR WORKAROUND FOR REMBG
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install onnxruntime-gpu
pip install fastapi uvicorn transformers pillow scikit-image transparent-background rembg opencv-python-headless python-multipart requests huggingface_hub scipy timm einops kornia
pip install carvekit #--extra-index-url https://download.pytorch.org/whl/cu121

# Ensure stuff is in the PATH
echo 'export PATH=$PATH:$HOME/.local/bin' >> ~/.bashrc
source ~/.bashrc

# Install additional requirements if there's a requirements.txt file
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi

mkdir -p ~/.ormbg && echo "Downloading the ORMBG model..." && wget -O ~/.ormbg/ormbg.pth https://huggingface.co/schirrmacher/ormbg/resolve/main/models/ormbg.pth

# No need to download BiRefNet weights as they will be loaded directly from Hugging Face
# Pre-download the model to avoid delays during runtime
echo "Pre-downloading BiRefNet model from HuggingFace..."
python3 -c "from transformers import AutoModelForImageSegmentation; print('Downloading BiRefNet model...'); model = AutoModelForImageSegmentation.from_pretrained('zhengpeng7/BiRefNet', trust_remote_code=True); print('BiRefNet model downloaded successfully!')"

# Pre-download rembg models
echo "Pre-downloading rembg models..."
python3 -c "from rembg import new_session; print('Downloading u2net...'); new_session('u2net'); print('Downloading u2netp...'); new_session('u2netp'); print('Downloading u2net_human_seg...'); new_session('u2net_human_seg'); print('Downloading isnet-general-use...'); new_session('isnet-general-use'); print('Downloading isnet-anime...'); new_session('isnet-anime'); print('Downloading sam...'); new_session('sam'); print('Downloading silueta...'); new_session('silueta'); print('All rembg models downloaded successfully!')"

echo "Setup completed successfully!"