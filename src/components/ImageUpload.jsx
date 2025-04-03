import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Paper,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import QueueIcon from '@mui/icons-material/Queue';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import axios from 'axios';
import { ImgComparisonSlider } from '@img-comparison-slider/react';
import pLimit from 'p-limit';
import GradientPickerPopout from './GradientPickerPopout';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import Magnifier from 'react18-image-magnifier'
import ModelsInfo from './ModelsInfo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GradientIcon from '@mui/icons-material/Gradient';
// Removed unnecessary imports

const ImageUpload = ({ onProcessed, fileID, selectedModels, showErrorToast }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFilename, setOriginalFilename] = useState('');
  const [processedFiles, setProcessedFiles] = useState({});
  const [activeMethod, setActiveMethod] = useState(null);
  const [processing, setProcessing] = useState({});
  const [localSelectedModels, setLocalSelectedModels] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [videoMethod, setVideoMethod] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  // Enhanced batch upload states
  const [batchFiles, setBatchFiles] = useState([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [totalBatchItems, setTotalBatchItems] = useState(0);
  const [batchFilenames, setBatchFilenames] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [batchThumbnailView, setBatchThumbnailView] = useState(false);
  const [parallelProcessing, setParallelProcessing] = useState(true);

  const [doZoom, setDoZoom] = useState(false);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'grid'

  const [transparent, setTransparent] = useState(true);
  const [colorBG, setColorBG] = useState('radial-gradient(circle, #fcdfa4 0%, #ffd83b 100%)'); //useState('radial-gradient(circle, #87CEFA 0%, #1E90FF 100%)');
  
  // Model parameters for customization - gets model-specific settings for any model
  const getModelParams = (method) => {
    // Clean method name for localStorage key (handle models with hyphens)
    const methodKey = method.replace('-', '_');
    
    // Get model-specific settings with defaults
    return {
      alpha_matting: localStorage.getItem(`bgbye_${methodKey}_alpha_matting`) === 'true',
      alpha_matting_foreground_threshold: parseInt(localStorage.getItem(`bgbye_${methodKey}_fg_threshold`) || 
        // Default values based on model
        (method === 'sam' ? '220' : 
         method === 'isnet-general-use' ? '240' :
         method === 'u2net' ? '235' :
         method === 'u2netp' ? '235' :
         method === 'isnet-anime' ? '235' : '240')),
      alpha_matting_background_threshold: parseInt(localStorage.getItem(`bgbye_${methodKey}_bg_threshold`) || 
        // Default values based on model
        (method === 'sam' ? '20' : 
         method === 'isnet-general-use' ? '10' :
         method === 'u2net' ? '15' :
         method === 'u2netp' ? '15' :
         method === 'isnet-anime' ? '15' : '10')),
      alpha_matting_erode_size: parseInt(localStorage.getItem(`bgbye_${methodKey}_erode_size`) || '10'),
      post_process_mask: localStorage.getItem(`bgbye_${methodKey}_post_process`) === 'true'
    };
  };

  // Set image width based on the actual image dimensions
  useEffect(() => {
    if (selectedFile) {
      const image = new Image();
      image.onload = () => {
        // We're not using setImageWidth anymore, but we could resize the container here if needed
      };
      image.src = selectedFile;
    }
  }, [selectedFile]);


  const theme = useTheme();
  const isPortrait = useMediaQuery('(orientation: portrait)');

  const fileInputID = "fileInput" + fileID.toString();

  const getModelAPIURL = (method)=>{
    console.log(method, ModelsInfo[method].apiUrlVar, import.meta.env[ModelsInfo[method].apiUrlVar]);

    return import.meta.env[ModelsInfo[method].apiUrlVar];
  }

  useEffect(() => {
    if (!localSelectedModels) {
      setLocalSelectedModels(selectedModels);
    }
  }, [selectedModels, localSelectedModels]);

  const dropZoneRef = useRef(null);
 


  const processFile = useCallback(async (file, method) => {
    // Validate file before sending
    if (!file || file.size === 0) {
      showErrorToast(`Invalid ${file.type.startsWith('video') ? 'video' : 'image'} file: Empty file`);
      return null;
    }
    
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showErrorToast(`Unsupported file type: ${file.type}`);
      return null;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('method', method);
    
    // Add model-specific parameters to the request
    const modelSpecificParams = getModelParams(method);
    Object.entries(modelSpecificParams).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const isVideo = file.type.startsWith('video');
    const endpoint = isVideo ? 'remove_background_video' : 'remove_background';
    
    try {
      // Log the file being processed
      console.log(`Processing ${isVideo ? 'video' : 'image'} with ${method}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const response = await axios.post(`${getModelAPIURL(method)}/${endpoint}/`, formData, {
        responseType: 'blob',
        withCredentials: false,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response && response.data) {
        const fileUrl = URL.createObjectURL(response.data);
        return fileUrl;
      }
    } catch (error) {
      const errorMessage = error.response && error.response.data ? 
        `Error: ${error.response.data.detail || error.message}` : 
        `Error processing ${isVideo ? 'video' : 'image'} with ${method}`;
        
      console.error(errorMessage, error);
      showErrorToast(errorMessage);
    }
    return null;
  }, [showErrorToast, getModelAPIURL]);

  // Process a single file - simplified version without queue
  const processSingleFile = useCallback(async (file) => {
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setFileType(isVideo ? 'video' : 'image');
    setSelectedFile(URL.createObjectURL(file));
    setOriginalFilename(file.name);
    setProcessedFiles({});
    setActiveMethod(null);
    
    const currentSelectedModels = {...selectedModels};
    setLocalSelectedModels(currentSelectedModels);

    if (!isVideo) {
      const initialProcessing = Object.fromEntries(
        Object.entries(currentSelectedModels)
          .filter(([_, isSelected]) => isSelected)
          .map(([method, _]) => [method, true])
      );
      setProcessing(initialProcessing);
  
      // Create a limit function that allows only 6 concurrent operations
      const limit = pLimit(6);
  
      // Create an array of promises
      const promises = Object.entries(currentSelectedModels)
        .filter(([_, isSelected]) => isSelected)
        .map(([method, _]) => 
          limit(() => processFile(file, method).then(result => {
            setProcessedFiles(prev => ({...prev, [method]: result}));
            setProcessing(prev => ({...prev, [method]: false}));
            if (!activeMethod) {
              setActiveMethod(method);
            }
          }))
        );
  
      // Wait for all promises to resolve
      await Promise.all(promises);
    }
  
    onProcessed();
    return true;
  }, [processFile, onProcessed, selectedModels, activeMethod]);

  // Process a single batch item
  const processBatchItem = useCallback(async (file, index, total) => {
    if (!file) return;
    
    setIsProcessingBatch(true);
    
    // Show progress
    toast.loading(`Processing file ${index + 1} of ${total}: ${file.name}`, {
      id: 'batch-progress',
    });
    
    try {
      // Process this file
      await processSingleFile(file);
      
      // Mark as complete
      toast.success(`Processed file ${index + 1} of ${total}`, {
        id: 'batch-progress',
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      showErrorToast(`Failed to process ${file.name}`);
    }
    
    setIsProcessingBatch(false);
  }, [processSingleFile, showErrorToast]);
  
  // Setup batch processing with parallel processing option
  const setupBatchProcessing = useCallback((files) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // Store the files for processing
    setBatchFiles(fileArray);
    setTotalBatchItems(fileArray.length);
    setCurrentBatchIndex(0);
    setBatchResults([]);
    
    // Store original filenames
    const filenames = fileArray.map(file => file.name);
    setBatchFilenames(filenames);
    
    if (parallelProcessing && fileArray.length > 1) {
      // Process all files in parallel
      toast.success(`Processing ${fileArray.length} files in parallel...`);
      processBatchParallel(fileArray);
    } else {
      // Process sequentially, starting with the first file
      toast.success(`Added ${fileArray.length} files to batch. Use the navigation buttons to view processed images.`);
      setTimeout(() => {
        processBatchItem(fileArray[0], 0, fileArray.length);
      }, 100);
    }
  }, [processBatchItem, parallelProcessing]);
  
  // Process all batch files in parallel
  const processBatchParallel = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setIsProcessingBatch(true);
    toast.loading(`Processing ${files.length} files in parallel...`, { id: 'batch-parallel' });
    
    try {
      // Create a limit function that allows reasonable concurrency (3 files at once)
      const limit = pLimit(3);
      
      // Process each file and collect results
      const promises = files.map((file, index) => 
        limit(async () => {
          toast.loading(`Processing ${index + 1}/${files.length}: ${file.name}`, { id: `file-${index}` });
          
          try {
            // Process this file using existing models
            const isVideo = file.type.startsWith('video');
            const fileType = isVideo ? 'video' : 'image';
            const fileUrl = URL.createObjectURL(file);
            
            const results = {};
            
            if (!isVideo) {
              // Process with all selected models
              const modelPromises = Object.entries(selectedModels)
                .filter(([_, isSelected]) => isSelected)
                .map(([method, _]) => processFile(file, method)
                  .then(result => {
                    if (result) results[method] = result;
                  }));
              
              await Promise.all(modelPromises);
            }
            
            toast.success(`Processed ${file.name}`, { id: `file-${index}` });
            
            return {
              originalUrl: fileUrl,
              originalName: file.name,
              results,
              fileType
            };
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}`, { id: `file-${index}` });
            return null;
          }
        })
      );
      
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      const validResults = results.filter(Boolean);
      
      setBatchResults(validResults);
      
      if (validResults.length > 0) {
        // Show first result
        const firstResult = validResults[0];
        setSelectedFile(firstResult.originalUrl);
        setOriginalFilename(firstResult.originalName);
        setFileType(firstResult.fileType);
        setProcessedFiles(firstResult.results);
        setActiveMethod(Object.keys(firstResult.results)[0] || null);
        
        setBatchThumbnailView(true);
        setViewMode('grid');
      }
      
      toast.success(`Processed ${validResults.length} of ${files.length} files successfully`, { id: 'batch-parallel' });
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast.error('Error processing batch files', { id: 'batch-parallel' });
    }
    
    setIsProcessingBatch(false);
  }, [processFile, selectedModels]);
  
  // Navigate to next or previous batch item
  const navigateBatch = useCallback((direction) => {
    if (batchFiles.length <= 1) return;
    
    if (batchResults.length > 0) {
      // Navigate through already processed results
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentBatchIndex + 1) % batchResults.length;
      } else {
        newIndex = (currentBatchIndex - 1 + batchResults.length) % batchResults.length;
      }
      
      setCurrentBatchIndex(newIndex);
      
      // Set the current item from results
      const currentItem = batchResults[newIndex];
      setSelectedFile(currentItem.originalUrl);
      setOriginalFilename(currentItem.originalName);
      setFileType(currentItem.fileType);
      setProcessedFiles(currentItem.results);
      setActiveMethod(Object.keys(currentItem.results)[0] || null);
    } else {
      // Original behavior for sequential processing
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentBatchIndex + 1) % batchFiles.length;
      } else {
        newIndex = (currentBatchIndex - 1 + batchFiles.length) % batchFiles.length;
      }
      
      setCurrentBatchIndex(newIndex);
      
      // Add a small delay before processing to ensure state updates
      setTimeout(() => {
        processBatchItem(batchFiles[newIndex], newIndex, batchFiles.length);
      }, 100);
    }
  }, [batchFiles, batchResults, currentBatchIndex, processBatchItem]);

  // Handle file upload (both single and multiple)
  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length === 1) {
      // Single file upload - process immediately
      processSingleFile(files[0]);
    } else {
      // Multiple files - process as batch
      setupBatchProcessing(files);
    }
  }, [processSingleFile, setupBatchProcessing]);

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      if (files.length === 1) {
        processSingleFile(files[0]);
      } else {
        setupBatchProcessing(files);
      }
    }
  }, [processSingleFile, setupBatchProcessing]);

  const handlePaste = useCallback((event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let pastedFiles = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        try {
          const blob = items[i].getAsFile();
          
          if (!blob || blob.size === 0) {
            console.error("Empty image data in clipboard");
            continue;
          }
          
          console.log("Pasted image:", {
            type: blob.type,
            size: blob.size
          });
          
          // Create a unique filename for pasted images
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const file = new File([blob], `pasted-image-${timestamp}.png`, { type: blob.type });
          pastedFiles.push(file);
        } catch (err) {
          console.error("Error handling pasted image:", err);
          showErrorToast("Error processing pasted image");
        }
      }
    }
    
    if (pastedFiles.length > 0) {
      if (pastedFiles.length === 1) {
        processSingleFile(pastedFiles[0]);
      } else {
        setupBatchProcessing(pastedFiles);
      }
    } else if (items.length > 0) {
      console.log("No valid image found in clipboard. Item types:", 
        Array.from(items).map(item => item.type).join(', '));
    }
  }, [processSingleFile, setupBatchProcessing, showErrorToast]);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (dropZone) {
      dropZone.addEventListener('paste', handlePaste);
      return () => {
        dropZone.removeEventListener('paste', handlePaste);
      };
    }
  }, [handlePaste]);

  const handleMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setActiveMethod(newMethod);
    }
  };

  const handleVideoMethodChange = (event) => {
    setVideoMethod(event.target.value);
  };

  const pollVideoStatus = useCallback(async (id, url) => {
    try {
      const response = await axios.get(`${url}/status/${id}`, {
        responseType: 'blob',
        withCredentials: false
      });

      // Check if the response is JSON (status update) or blob (completed video)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.indexOf('application/json') !== -1) {
        // It's a JSON response (status update)
        const data = await response.data.text().then(JSON.parse);
        if (data.status === 'processing') {
          setVideoProgress(data.progress);
          setStatusMessage(data.message);
          setTimeout(() => pollVideoStatus(id, url), 4000); // Poll every 4 seconds
        } else if (data.status === 'error') {
          showErrorToast('Error processing video: ' + data.message);
          setProcessing({ [videoMethod]: false });
          setStatusMessage('Error: ' + data.message);
        }
      } else {
        // It's a blob response (completed video)
        setVideoProgress(100);
        setProcessing({ [videoMethod]: false });
        setActiveMethod(videoMethod);
        setStatusMessage('Processing complete');

        const blobUrl = URL.createObjectURL(response.data);
        setProcessedFiles({ [videoMethod]: blobUrl });
      }
    } catch (error) {
      console.error('Error polling video status:', error);
      setProcessing({ [videoMethod]: false });
      setStatusMessage('Error: Failed to get status update');
      showErrorToast('Error: Failed to get status update');
    }
  }, [videoMethod, showErrorToast]);

  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      }

      video.onerror = function() {
        reject("Invalid video. Please select another video file.");
      }

      video.src = URL.createObjectURL(file);
    });
  }

  const handleProcessVideo = async () => {
    if (!selectedFile || !videoMethod) return;

    setProcessing({ [videoMethod]: true });
    setVideoProgress(0);

    try {
      const file = await fetch(selectedFile).then(r => r.blob());
      
      // Get video duration
      const duration = await getVideoDuration(file);
      // Disabled video length limit code is commented out
      
      //DISABLED VIDEO LENGTH LIMIT
      //if (duration > 10){
      //  showErrorToast(`Video too long (${duration.toFixed(1)} seconds). Maximum allowed: 10 seconds.`);
      //  setProcessing({ [videoMethod]: false });
      //  return;
      // }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('method', videoMethod);

      const response = await axios.post(`${getModelAPIURL(videoMethod)}/remove_background_video/`, formData, {
        withCredentials: false,
      });


      setVideoId(response.data.video_id);
      pollVideoStatus(response.data.video_id, getModelAPIURL(videoMethod));
    } catch (error) {
      console.error('Error processing video:', error);
      setProcessing({ [videoMethod]: false });
      showErrorToast('Error processing video: ', error);
    }
  };

  // Helper function to prepare and download a single image
  const prepareImageForDownload = (imageUrl, methodName) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.src = imageUrl;

      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        if (transparent === false) {
          if (colorBG.includes("gradient")) {
            const tempDiv = document.createElement("div");
            tempDiv.style.display = 'none'; // Hide the div while it's appended
            tempDiv.style.background = colorBG;
            document.body.appendChild(tempDiv);
            const computedStyle = window.getComputedStyle(tempDiv);
            const bgImage = computedStyle.backgroundImage;
            document.body.removeChild(tempDiv);

            if (bgImage.startsWith('linear-gradient')) {
              parseLinearGradient(ctx, bgImage, canvas.width, canvas.height);
            } else if (bgImage.startsWith('radial-gradient')) {
              parseRadialGradient(ctx, bgImage, canvas.width, canvas.height);
            }
          } else {
            ctx.fillStyle = colorBG;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }

        ctx.drawImage(image, 0, 0);
        
        const fileExtension = 'png';
        const newFilename = `${originalFilename.split('.')[0]}_${methodName}.${fileExtension}`;
        const dataUrl = canvas.toDataURL(`image/${fileExtension}`);
        
        resolve({ dataUrl, filename: newFilename });
      };
    });
  };

  // Handle batch download of all processed images
  const handleBatchDownload = async () => {
    if (fileType === 'video') {
      // For videos, just download the current active method
      handleDownload();
      return;
    }
    
    // Show a loading indicator/toast
    const toastId = toast.loading('Preparing images for download...');
    
    try {
      // If we're using JSZip for batch downloads
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // For batch results, download all processed images
      if (batchResults.length > 0 && batchThumbnailView) {
        // Create folder structure by model 
        let totalFiles = 0;
        
        // Get all model names used across batch results
        const allMethods = new Set();
        batchResults.forEach(item => {
          Object.keys(item.results).forEach(method => allMethods.add(method));
        });
        
        // For each model, create a folder and add all images processed with that model
        for (const method of allMethods) {
          const methodFolder = zip.folder(method);
          
          // Add all files processed with this model
          for (const item of batchResults) {
            if (item.results[method]) {
              const originalName = item.originalName.split('.')[0];
              const { dataUrl } = await prepareImageForDownload(item.results[method], method);
              const base64Data = dataUrl.split(',')[1];
              methodFolder.file(`${originalName}_${method}.png`, base64Data, { base64: true });
              totalFiles++;
            }
          }
        }
        
        // Generate and download the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `bgbye_batch_${new Date().toISOString().replace(/:/g, '-')}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`All ${totalFiles} processed images downloaded as ZIP`, { id: toastId });
      } else {
        // Original behavior - download all methods for current image
        const downloadPromises = Object.entries(processedFiles).map(async ([method, url]) => {
          const { dataUrl, filename } = await prepareImageForDownload(url, method);
          // Extract the base64 data from dataUrl (remove the prefix)
          const base64Data = dataUrl.split(',')[1];
          // Add file to zip
          zip.file(filename, base64Data, { base64: true });
        });
        
        // Wait for all images to be processed
        await Promise.all(downloadPromises);
        
        // Generate zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${originalFilename.split('.')[0]}_all_methods.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('All images downloaded as ZIP', { id: toastId });
      }
    } catch (error) {
      console.error('Error during batch download:', error);
      toast.error('Failed to download images', { id: toastId });
      
      // Fallback to individual downloads if zip creation fails
      Object.entries(processedFiles).forEach(([method, url]) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${originalFilename.split('.')[0]}_${method}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  // Handle single image download
  const handleDownload = () => {
    if (fileType === 'video') {
      // Directly download the video file as a .webm
      const newFilename = `${originalFilename.split('.')[0]}_${activeMethod}.webm`;
      const link = document.createElement('a');
      link.href = processedFiles[activeMethod];
      link.download = newFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle image downloading with canvas manipulations
      prepareImageForDownload(processedFiles[activeMethod], activeMethod)
        .then(({ dataUrl, filename }) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    }
  };


function parseLinearGradient(ctx, bgImage, width, height) {
    const colors = bgImage.match(/rgba?\([^)]+\)/g);
    const linearGradient = ctx.createLinearGradient(0, 0, width, 0);
    colors.forEach((color, index) => {
        const position = index / (colors.length - 1);
        linearGradient.addColorStop(position, color);
    });
    ctx.fillStyle = linearGradient;
    ctx.fillRect(0, 0, width, height);
}

function parseRadialGradient(ctx, bgImage, width, height) {
    const colors = bgImage.match(/rgba?\([^)]+\)/g);
    const radialGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    colors.forEach((color, index) => {
        const position = index / (colors.length - 1);
        radialGradient.addColorStop(position, color);
    });
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);
}


return (
  <Box
      ref={dropZoneRef}
      tabIndex="0" // Make the box focusable
      onKeyDown={(e) => {
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
          // This allows the paste event to fire when the box is focused
          // and the user presses Ctrl+V or Cmd+V
        }
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: (!selectedFile) ? '2px dashed' : 'none',
        borderColor: dragOver ? theme.palette.primary.main : theme.palette.text.disabled,
        borderRadius: 1,
        p: isPortrait ? 0 : 2,
        mt: 2,
        textAlign: 'center',
        cursor: !selectedFile && !processing ? 'pointer' : 'default',
        position: 'relative',
        backgroundColor: dragOver ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
        transition: 'all 0.3s ease',
      }}
      onClick={() => !selectedFile && !Object.values(processing).some(Boolean) && document.getElementById(fileInputID).click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
     {!selectedFile && (
        <input
          type="file"
          id={fileInputID}
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      )}
      
    {/* Batch gallery view */}
    {batchResults.length > 0 && viewMode === 'grid' && batchThumbnailView && (
      <Box sx={{ 
        width: '100%', 
        mt: 2, 
        p: 2, 
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Batch Gallery ({batchResults.length} files)</Typography>
        <Grid container spacing={2}>
          {batchResults.map((item, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
              <Paper 
                elevation={currentBatchIndex === index ? 3 : 1}
                sx={{ 
                  p: 1, 
                  cursor: 'pointer',
                  border: currentBatchIndex === index ? `2px solid ${theme.palette.primary.main}` : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setCurrentBatchIndex(index);
                  setSelectedFile(item.originalUrl);
                  setOriginalFilename(item.originalName);
                  setFileType(item.fileType);
                  setProcessedFiles(item.results);
                  setActiveMethod(Object.keys(item.results)[0] || null);
                  // Stay in grid view when in batch view
                }}
              >
                <img 
                  src={item.originalUrl} 
                  alt={item.originalName}
                  style={{ 
                    width: '100%', 
                    height: '120px', 
                    objectFit: 'cover',
                    borderRadius: 4
                  }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.originalName}
                </Typography>
                {currentBatchIndex === index && (
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: theme.palette.primary.main }}>
                    Selected
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    )}

    {selectedFile ? (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isPortrait ? 'column' : 'row',
        alignItems: 'flex-start', 
        width: '100%', 
        position: 'relative',
      }}>
         
        <Box sx={{ 
          flex: 1, 
          mr: isPortrait ? 0 : 2,
          mb: isPortrait ? 2 : 0,
          width: '100%',
        }}>
            {fileType === 'image' ? (
              viewMode === 'grid' && Object.keys(processedFiles).length > 1 ? (
                // Grid view for comparing all processed images
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                    {/* Batch mode progress and navigation */}
                    {batchFiles.length > 1 && (
                      <Box sx={{ mb: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Button
                            size="small"
                            startIcon={<KeyboardArrowLeftIcon />}
                            onClick={() => navigateBatch('prev')}
                            disabled={isProcessingBatch}
                          >
                            Previous
                          </Button>
                          
                          <Typography variant="body2" color="text.secondary">
                            File {currentBatchIndex + 1} of {totalBatchItems}: {batchFilenames[currentBatchIndex] || ''}
                          </Typography>
                          
                          <Button
                            size="small"
                            endIcon={<KeyboardArrowRightIcon />}
                            onClick={() => navigateBatch('next')}
                            disabled={isProcessingBatch}
                          >
                            Next
                          </Button>
                        </Box>
                        
                        <LinearProgress 
                          variant={isProcessingBatch ? "indeterminate" : "determinate"} 
                          value={(currentBatchIndex / (totalBatchItems - 1)) * 100} 
                          color="secondary"
                          sx={{ height: 6, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Click any image to select and view it in detail
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Download all processed images at once" arrow>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleBatchDownload()}
                          >
                            Batch Download
                          </Button>
                        </Tooltip>
                        <Tooltip title={doZoom ? "Hover over images to magnify details" : "Enable magnifying glass for all images"} arrow>
                          <ToggleButton
                            value="grid-zoom"
                            selected={doZoom}
                            onChange={() => setDoZoom(!doZoom)}
                            aria-label="enable zoom"
                            size="small"
                            color="primary"
                          >
                            <ZoomInIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {doZoom ? "Disable Zoom" : "Enable Zoom"}
                          </ToggleButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                  {/* Original image */}
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                    <Card sx={{ height: '100%', position: 'relative' }}>
                      <Box position="relative" height={{ xs: 200, md: 250, lg: 300 }} sx={{ backgroundColor: '#f0f0f0' }}>
                        {doZoom ? (
                          <Magnifier 
                            src={selectedFile} 
                            width={'100%'} 
                            height={'100%'} 
                            style={{objectFit: 'contain'}} 
                            mgWidth={200}
                            mgHeight={200}
                            zoomFactor={2}
                          />
                        ) : (
                          <CardMedia
                            component="img"
                            image={selectedFile}
                            alt="Original"
                            sx={{ 
                              height: { xs: 200, md: 250, lg: 300 }, 
                              objectFit: 'contain',
                              backgroundColor: '#f0f0f0'
                            }}
                          />
                        )}
                      </Box>
                      <CardContent sx={{ p: 1, pb: '8px !important' }}>
                        <Typography variant="subtitle2" align="center">
                          Original
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Processed images */}
                  {Object.entries(processedFiles).map(([method, url]) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={method}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          border: method === activeMethod ? `2px solid ${theme.palette.primary.main}` : 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: method === activeMethod ? `0 0 8px ${theme.palette.primary.main}` : undefined
                        }}
                        onClick={() => {
                          setActiveMethod(method);
                          // Don't change view mode in batch mode
                          if (!batchThumbnailView) {
                            setViewMode('single');
                          }
                        }}
                      >
                        {method === activeMethod && (
                          <Box 
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                              padding: '4px 8px',
                              zIndex: 2,
                              fontSize: '0.75rem',
                              borderBottomLeftRadius: 4
                            }}
                          >
                            Selected
                          </Box>
                        )}
                        <Box 
                          className={transparent ? "checkerboard" : ""}
                          sx={!transparent ? { background: colorBG } : {}}
                          position="relative"
                        >
                          {doZoom ? (
                            <Box height={{ xs: 200, md: 250, lg: 300 }}>
                              <Magnifier 
                                src={url} 
                                width={'100%'} 
                                height={'100%'} 
                                style={{objectFit: 'contain'}}
                                mgWidth={200}
                                mgHeight={200}
                                zoomFactor={2}
                              />
                            </Box>
                          ) : (
                            <CardMedia
                              component="img"
                              image={url}
                              alt={`Processed with ${ModelsInfo[method].displayName}`}
                              sx={{ 
                                height: { xs: 200, md: 250, lg: 300 }, 
                                objectFit: 'contain'
                              }}
                            />
                          )}
                        </Box>
                        <CardContent sx={{ p: 1, pb: '8px !important' }}>
                          <Typography variant="subtitle2" align="center">
                            {ModelsInfo[method].displayName}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  </Grid>
                </Box>
              ) : processedFiles[activeMethod] ? (
                // Single view with comparison slider
                <div>
                  {/* Batch mode progress and navigation */}
                  {batchFiles.length > 1 && (
                    <Box sx={{ mb: 2, width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Button
                          size="small"
                          startIcon={<KeyboardArrowLeftIcon />}
                          onClick={() => navigateBatch('prev')}
                          disabled={isProcessingBatch && batchResults.length === 0}
                        >
                          Previous
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary">
                          File {currentBatchIndex + 1} of {batchResults.length || totalBatchItems}: {
                            batchResults.length > 0 
                              ? batchResults[currentBatchIndex]?.originalName 
                              : batchFilenames[currentBatchIndex] || ''
                          }
                        </Typography>
                        
                        <Button
                          size="small"
                          endIcon={<KeyboardArrowRightIcon />}
                          onClick={() => navigateBatch('next')}
                          disabled={isProcessingBatch && batchResults.length === 0}
                        >
                          Next
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <LinearProgress 
                          variant={isProcessingBatch && batchResults.length === 0 ? "indeterminate" : "determinate"} 
                          value={batchResults.length > 0 
                            ? (currentBatchIndex / (batchResults.length - 1)) * 100
                            : (currentBatchIndex / (totalBatchItems - 1)) * 100
                          } 
                          color="secondary"
                          sx={{ height: 6, borderRadius: 4, flexGrow: 1, mr: 2 }}
                        />
                        
                        {batchThumbnailView && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
                          >
                            {viewMode === 'single' ? 'Grid View' : 'Single View'}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}
                  <div 
                    className={transparent ? "checkerboard" : ""}
                    style={!transparent ? { background: colorBG } : {}}
                  >
                  <ToggleButton
                    value="zoom"
                    selected={doZoom}
                    onChange={() => setDoZoom(!doZoom)}
                    aria-label="zoom in"
                    size='small'
                    color='primary'
                    sx={{
                      position: 'absolute',
                      top: '3em', 
                      left: '3em', 
                      zIndex: 9999
                    }}
                  >
                    <ZoomInIcon color='primary'/>
                  </ToggleButton>

                  {doZoom && <Magnifier 
                    src={processedFiles[activeMethod]} 
                    width={'100%'} 
                    mgWidth={250}
                    mgHeight={250}
                    zoomFactor={2}
                  />}
               
                {!doZoom && <ImgComparisonSlider class="slider-example-focus">
                  <img slot="first" src={selectedFile} alt="Original" style={{ width: '100%' }} />
                  <img slot="second" src={processedFiles[activeMethod]} alt="Processed" style={{ width: '100%' }} />
                  {false && <svg slot="handle" xmlns="http://www.w3.org/2000/svg" width="100" viewBox="-8 -3 16 6">
                    <path stroke="#549ef7" d="M -5 -2 L -7 0 L -5 2 M -5 -2 L -5 2 M 5 -2 L 7 0 L 5 2 M 5 -2 L 5 2" strokeWidth="1" fill="#549ef7" vectorEffect="non-scaling-stroke"></path>
                  </svg>}
                </ImgComparisonSlider>}
                  </div>
                </div>
              ) : (
                // Loading state
                <>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <CircularProgress style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    <img src={selectedFile} alt="Uploaded" style={{ width: '100%', display: "block", boxShadow: '0px 0px 10px 5px #6464647a' }} />
                  </div>
                </>
              )
            ) : (
              // Video display
              <video src={processedFiles[activeMethod] || selectedFile} controls style={{ width: '100%' }}>
                Your browser does not support the video tag.
              </video>
            )}
          </Box>
          
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            position: isPortrait ? 'absolute' : 'static',
            top: isPortrait ? '1em' : 'auto',
            right: isPortrait ? '1em' : 'auto',
            zIndex: isPortrait ? 1000 : 'auto',
            width: isPortrait ? 'auto' : '250px',
          }}>
           {/* View mode toggle button */}
           {fileType === 'image' && Object.keys(processedFiles).length > 1 && (
              <Paper 
                sx={{ 
                  mb: 2, 
                  p: 1, 
                  width: '100%', 
                  backgroundColor: isPortrait ? 'rgba(255,255,255,0.9)' : theme.palette.background.paper 
                }} 
                elevation={isPortrait ? 3 : 1}
              >
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                  View Mode
                </Typography>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newViewMode) => newViewMode && setViewMode(newViewMode)}
                  aria-label="view mode"
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="single" aria-label="single view">
                    <ViewCarouselIcon sx={{ mr: isPortrait ? 0 : 1 }} />
                    {!isPortrait && "Compare"}
                  </ToggleButton>
                  <ToggleButton value="grid" aria-label="grid view">
                    <ViewModuleIcon sx={{ mr: isPortrait ? 0 : 1 }} />
                    {!isPortrait && "Grid"}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Paper>
            )}
           {(!isPortrait || fileType !== 'video') && <Paper sx={{
              backgroundColor: isPortrait ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0)',
              padding: isPortrait ? 1 : 0,
            }} elevation={2}>
               <Typography variant="body2" color="text.secondary" align="center">
                Methods
              </Typography>
              {selectedFile && localSelectedModels && fileType === 'image' && (
                <ToggleButtonGroup
                  orientation="vertical"
                  fullWidth
                  value={activeMethod}
                  exclusive
                  color="warning"
                  onChange={handleMethodChange}
                  aria-label="background removal method"
                  sx={{
                    flexDirection: 'column',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  {Object.entries(localSelectedModels)
                    .filter(([_, isSelected]) => isSelected)
                    .map(([method, _]) => (
                      <ToggleButton 
                      size="small"
                      
                        key={method} 
                        value={method} 
                        aria-label={`${method} method`}
                        disabled={processing[method]}
                        sx={{ 
                          justifyContent: 'space-between', 
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="flex-start" width="100%">
                          {isPortrait ? ModelsInfo[method].shortName : ModelsInfo[method].displayName}
                          {processing[method] && <CircularProgress size={16} sx={{ ml: 1 }} />}
                        </Box>
                      </ToggleButton>
                    ))
                  }
                </ToggleButtonGroup>
              )}
              
            </Paper>}
          {selectedFile && fileType === 'video' && (
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="video-method-label" >Method</InputLabel>
            <Select
              disabled={processing[videoMethod] || Object.keys(processedFiles).length > 0}
              labelId="video-method-label"
              value={videoMethod}
              label="Method"
              sx={{backgroundColor:isPortrait? theme.palette.info.contrastText :''}}
              onChange={handleVideoMethodChange}
            >
              {Object.entries(localSelectedModels)
                .filter(([_, isSelected]) => isSelected)
                .map(([method, _]) => (
                  <MenuItem key={method} value={method}>{ModelsInfo[method].displayName}</MenuItem>
                ))
              }
            </Select>
          </FormControl>
          {Object.keys(processedFiles).length === 0 && <Button
            variant="contained"
            color="primary"
            onClick={handleProcessVideo}
            disabled={!videoMethod || Object.values(processing).some(Boolean)}
            sx={{ mt: 2 }}
          >
            Process Video
            {processing[videoMethod] && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Button>}
          {processing[videoMethod] && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress
                variant={videoProgress === 100 ? "indeterminate" : "determinate"}
                value={videoProgress}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                {statusMessage} {videoProgress < 100 && `(${Math.round(videoProgress)}%)`}
              </Typography>
            </Box>
          )}
        </Box>
      )}
            
            {processedFiles[activeMethod] && (
              <>
              

              {!isPortrait && fileType==='image' && <FormControlLabel
                  control={<Checkbox checked={transparent} onChange={(e)=>setTransparent(e.target.checked)} />}
                  label="Transparent"
                  sx={{color:theme.palette.text.primary}}
              />}

              {isPortrait && fileType==='image' && <ToggleButton sx={{backgroundColor:theme.palette.divider, p:0}}  value="transparent" selected={!transparent} onChange={()=>{setTransparent(!transparent)}}><GradientIcon fontSize='large' color='primary'/></ToggleButton>}

              {!transparent && fileType==='image' &&  <GradientPickerPopout
                buttonLabel={!isPortrait ? "Background" : ""}
                
                color={colorBG}
                onChange={newColor => setColorBG(newColor)}
              />}

                <Button
                variant="contained"
                color="primary"
                onClick={handleDownload}
                endIcon={<DownloadIcon />}
                sx={{ mt: 2 }}
              >
                {!isPortrait && "Download"}
              </Button>
              </>
            )}
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            {dragOver ? "Release to upload files" : "Click, drag and drop multiple files, or paste (ctrl-v) to upload"}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
            Multiple files can be processed in parallel or sequentially
          </Typography>
          
          {/* Batch upload controls */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 2, 
            mb: 2,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={parallelProcessing} 
                  onChange={(e) => setParallelProcessing(e.target.checked)}
                  color="primary"
                />
              }
              label="Process files in parallel (faster)"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ImageUpload;