import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Popover, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Divider, 
  IconButton,
  Box,
  Typography,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import ChecklistIcon from '@mui/icons-material/Checklist';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import ModelsInfo from './ModelsInfo';

const MethodSelector = ({ selectedModels, handleModelChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  // General model settings state
  const [modelParams, setModelParams] = useState({
    alpha_matting: localStorage.getItem('bgbye_alpha_matting') === 'true',
    alpha_matting_foreground_threshold: parseInt(localStorage.getItem('bgbye_fg_threshold') || '240'),
    alpha_matting_background_threshold: parseInt(localStorage.getItem('bgbye_bg_threshold') || '10'),
    alpha_matting_erode_size: parseInt(localStorage.getItem('bgbye_erode_size') || '10'),
    post_process_mask: localStorage.getItem('bgbye_post_process') === 'true'
  });
  
  // Model-specific settings
  const [selectedModel, setSelectedModel] = useState('sam');
  
  // Initialize settings for all models
  const initializeModelSettings = () => {
    const initialSettings = {};
    
    // Default settings for each model type
    const defaultSettings = {
      // SAM settings - optimized for details but might over-segment
      sam: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 220,
        alpha_matting_background_threshold: 20,
        post_process_mask: true
      },
      // ISNET settings - balanced approach
      'isnet-general-use': {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // U2Net settings - good for general images
      u2net: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 235,
        alpha_matting_background_threshold: 15,
        post_process_mask: false
      },
      // U2Net lite settings - similar to U2Net
      u2netp: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 235,
        alpha_matting_background_threshold: 15,
        post_process_mask: false
      },
      // Human segmentation specific settings
      'u2net_human_seg': {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // Anime specific settings
      'isnet-anime': {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 235,
        alpha_matting_background_threshold: 15,
        post_process_mask: false
      },
      // Silueta settings
      silueta: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // Settings for each Carvekit model
      tracer: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10, 
        post_process_mask: false
      },
      basnet: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      deeplab: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // ORMBG settings
      ormbg: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // Bria settings
      bria: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // RMBG 2.0 settings (using fallback to isnet)
      rmbg2: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      },
      // InspyreNet settings
      inspyrenet: {
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        post_process_mask: false
      }
    };
    
    // For each model, either load from localStorage or use defaults
    Object.keys(ModelsInfo).forEach(model => {
      const modelStorageKey = model.replace('-', '_');
      initialSettings[model] = {
        alpha_matting: localStorage.getItem(`bgbye_${modelStorageKey}_alpha_matting`) === 'true' || 
                       (defaultSettings[model] ? defaultSettings[model].alpha_matting : true),
        alpha_matting_foreground_threshold: parseInt(localStorage.getItem(`bgbye_${modelStorageKey}_fg_threshold`) || 
                                                  (defaultSettings[model] ? defaultSettings[model].alpha_matting_foreground_threshold : 240)),
        alpha_matting_background_threshold: parseInt(localStorage.getItem(`bgbye_${modelStorageKey}_bg_threshold`) || 
                                                  (defaultSettings[model] ? defaultSettings[model].alpha_matting_background_threshold : 10)),
        post_process_mask: localStorage.getItem(`bgbye_${modelStorageKey}_post_process`) === 'true' || 
                         (defaultSettings[model] ? defaultSettings[model].post_process_mask : false)
      };
    });
    
    return initialSettings;
  };
  
  const [modelSpecificSettings, setModelSpecificSettings] = useState(initializeModelSettings());
  
  // Update model params from localStorage when component mounts or settings change
  useEffect(() => {
    const updateModelParams = () => {
      setModelParams({
        alpha_matting: localStorage.getItem('bgbye_alpha_matting') === 'true',
        alpha_matting_foreground_threshold: parseInt(localStorage.getItem('bgbye_fg_threshold') || '240'),
        alpha_matting_background_threshold: parseInt(localStorage.getItem('bgbye_bg_threshold') || '10'),
        alpha_matting_erode_size: parseInt(localStorage.getItem('bgbye_erode_size') || '10'),
        post_process_mask: localStorage.getItem('bgbye_post_process') === 'true'
      });
    };
    
    // Update on mount
    updateModelParams();
    
    // Set up storage event listener for cross-component updates
    window.addEventListener('storage', updateModelParams);
    
    return () => {
      window.removeEventListener('storage', updateModelParams);
    };
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'method-selector-popover' : undefined;

  const handleInfoClick = (apiUrl) => {
    window.open(apiUrl, '_blank');
  };

  return (
    <>
      <Button variant="contained" onClick={handleClick} endIcon={<ChecklistIcon/>} size='small' sx={{mt:1}}>
        Models & Settings
      </Button>
      <Popover
        elevation={2}
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { maxWidth: '400px', width: '100%' }
        }}
      >
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Models & Settings
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="model-select-label">Configure Model</InputLabel>
              <Select
                labelId="model-select-label"
                id="model-select"
                value={selectedModel}
                label="Configure Model"
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {Object.keys(ModelsInfo).map(model => (
                <MenuItem key={model} value={model}>
                  {ModelsInfo[model].displayName}
                </MenuItem>
              ))}
              </Select>
            </FormControl>
          </Box>
          
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>
                {ModelsInfo[selectedModel] ? ModelsInfo[selectedModel].displayName + ' Settings' : 'Model Settings'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quality Settings:
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={modelSpecificSettings[selectedModel].alpha_matting}
                      onChange={(e) => {
                        const newSettings = {...modelSpecificSettings};
                        newSettings[selectedModel] = {
                          ...newSettings[selectedModel],
                          alpha_matting: e.target.checked
                        };
                        setModelSpecificSettings(newSettings);
                        localStorage.setItem(`bgbye_${selectedModel}_alpha_matting`, e.target.checked);
                      }}
                    />
                  }
                  label="Alpha Matting (smoother edges)"
                />
                
                <Tooltip title={selectedModel === 'sam' ? 
                  "Lower values (220) preserve more logo details" : 
                  "Controls edge detection sensitivity"}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Foreground Threshold: {modelSpecificSettings[selectedModel].alpha_matting_foreground_threshold}
                    </Typography>
                    <Slider
                      value={modelSpecificSettings[selectedModel].alpha_matting_foreground_threshold}
                      min={200}
                      max={240}
                      marks={[
                        { value: 200, label: '200' },
                        { value: 220, label: '220' },
                        { value: 240, label: '240' },
                      ]}
                      onChange={(_, value) => {
                        const newSettings = {...modelSpecificSettings};
                        newSettings[selectedModel] = {
                          ...newSettings[selectedModel],
                          alpha_matting_foreground_threshold: value
                        };
                        setModelSpecificSettings(newSettings);
                        localStorage.setItem(`bgbye_${selectedModel}_fg_threshold`, value);
                      }}
                    />
                  </Box>
                </Tooltip>
                
                <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                  Background Threshold: {modelSpecificSettings[selectedModel].alpha_matting_background_threshold}
                </Typography>
                <Slider
                  value={modelSpecificSettings[selectedModel].alpha_matting_background_threshold}
                  min={5}
                  max={30}
                  marks={[
                    { value: 5, label: '5' },
                    { value: 15, label: '15' },
                    { value: 30, label: '30' },
                  ]}
                  onChange={(_, value) => {
                    const newSettings = {...modelSpecificSettings};
                    newSettings[selectedModel] = {
                      ...newSettings[selectedModel],
                      alpha_matting_background_threshold: value
                    };
                    setModelSpecificSettings(newSettings);
                    localStorage.setItem(`bgbye_${selectedModel}_bg_threshold`, value);
                  }}
                />
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={modelSpecificSettings[selectedModel].post_process_mask}
                      onChange={(e) => {
                        const newSettings = {...modelSpecificSettings};
                        newSettings[selectedModel] = {
                          ...newSettings[selectedModel],
                          post_process_mask: e.target.checked
                        };
                        setModelSpecificSettings(newSettings);
                        localStorage.setItem(`bgbye_${selectedModel}_post_process`, e.target.checked);
                      }}
                    />
                  }
                  label="Post-process Mask (better for logos)"
                />
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ mb: 1, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Presets for {ModelsInfo[selectedModel] ? ModelsInfo[selectedModel].displayName : 'this model'}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    size="small"
                    onClick={() => {
                      const newSettings = {...modelSpecificSettings};
                      
                      if (selectedModel === 'sam') {
                        // SAM Logo optimization
                        newSettings.sam = {
                          alpha_matting: true,
                          alpha_matting_foreground_threshold: 220,
                          alpha_matting_background_threshold: 20,
                          post_process_mask: true
                        };
                        
                        localStorage.setItem('bgbye_sam_alpha_matting', 'true');
                        localStorage.setItem('bgbye_sam_fg_threshold', '220');
                        localStorage.setItem('bgbye_sam_bg_threshold', '20');
                        localStorage.setItem('bgbye_sam_post_process', 'true');
                      } else {
                        // ISNET Logo optimization
                        newSettings['isnet-general-use'] = {
                          alpha_matting: true,
                          alpha_matting_foreground_threshold: 230,
                          alpha_matting_background_threshold: 15,
                          post_process_mask: true
                        };
                        
                        localStorage.setItem('bgbye_isnet-general-use_alpha_matting', 'true');
                        localStorage.setItem('bgbye_isnet-general-use_fg_threshold', '230');
                        localStorage.setItem('bgbye_isnet-general-use_bg_threshold', '15');
                        localStorage.setItem('bgbye_isnet-general-use_post_process', 'true');
                      }
                      
                      setModelSpecificSettings(newSettings);
                    }}
                  >
                    Logo Optimization
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    color="primary"
                    size="small"
                    onClick={() => {
                      const newSettings = {...modelSpecificSettings};
                      
                      if (selectedModel === 'sam') {
                        // SAM General purpose
                        newSettings.sam = {
                          alpha_matting: true,
                          alpha_matting_foreground_threshold: 240,
                          alpha_matting_background_threshold: 10,
                          post_process_mask: false
                        };
                        
                        localStorage.setItem('bgbye_sam_alpha_matting', 'true');
                        localStorage.setItem('bgbye_sam_fg_threshold', '240');
                        localStorage.setItem('bgbye_sam_bg_threshold', '10');
                        localStorage.setItem('bgbye_sam_post_process', 'false');
                      } else {
                        // ISNET General purpose
                        newSettings['isnet-general-use'] = {
                          alpha_matting: true,
                          alpha_matting_foreground_threshold: 240,
                          alpha_matting_background_threshold: 10,
                          post_process_mask: false
                        };
                        
                        localStorage.setItem('bgbye_isnet-general-use_alpha_matting', 'true');
                        localStorage.setItem('bgbye_isnet-general-use_fg_threshold', '240');
                        localStorage.setItem('bgbye_isnet-general-use_bg_threshold', '10');
                        localStorage.setItem('bgbye_isnet-general-use_post_process', 'false');
                      }
                      
                      setModelSpecificSettings(newSettings);
                    }}
                  >
                    General Purpose
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2a-content"
              id="panel2a-header"
            >
              <Typography>Available Models</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup sx={{ p: 1 }}>
                {Object.keys(selectedModels).map((model, index) => (
                  <React.Fragment key={model}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedModels[model]}
                          onChange={handleModelChange}
                          name={model}
                        />
                      }
                      label={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>{ModelsInfo[model].displayName}</span>
                          <IconButton
                            size="small"
                            onClick={() => handleInfoClick(ModelsInfo[model].sourceUrl)}
                            style={{ marginLeft: '8px' }}
                          >
                            <HelpOutlineIcon fontSize="small" />
                          </IconButton>
                        </div>
                      }
                    />
                    {index < Object.keys(selectedModels).length - 1 && (
                      <Divider orientation="horizontal" flexItem />
                    )}
                  </React.Fragment>
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
          
        </Box>
      </Popover>
    </>
  );
};

export default MethodSelector;