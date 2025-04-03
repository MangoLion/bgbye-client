import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  Slider,
  Tooltip,
  Box,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';

const ModelSettingsPanel = ({ modelParams, setModelParams, activeMethod, compact = false }) => {
  // Settings visibility based on model type
  const showSAMSettings = activeMethod === 'sam';
  const showAlphaMatting = ['sam', 'u2net', 'u2netp', 'isnet-general-use', 'silueta'].includes(activeMethod);
  
  const handleSliderChange = (prop, value) => {
    setModelParams({...modelParams, [prop]: value});
  };
  
  const handleCheckboxChange = (event) => {
    setModelParams({...modelParams, [event.target.name]: event.target.checked});
  };
  
  return (
    <Accordion 
      sx={{ 
        mt: 1, 
        width: '100%',
        ...(compact ? { 
          '& .MuiAccordionSummary-root': { 
            minHeight: '40px',
            py: 0
          }
        } : {})
      }}
      defaultExpanded={!compact}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="model-settings-content"
        id="model-settings-header"
      >
        <Box display="flex" alignItems="center">
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant={compact ? "body2" : "body1"}>
            {compact ? "Model Settings" : "Advanced Settings"}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {showAlphaMatting && (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={modelParams.alpha_matting}
                  onChange={handleCheckboxChange}
                  name="alpha_matting"
                />
              }
              label="Alpha Matting (smoother edges)"
            />
            
            {modelParams.alpha_matting && (
              <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Foreground Threshold ({modelParams.alpha_matting_foreground_threshold})
                </Typography>
                <Tooltip title="Lower values preserve more details in logos">
                  <Slider
                    value={modelParams.alpha_matting_foreground_threshold}
                    onChange={(_, value) => handleSliderChange('alpha_matting_foreground_threshold', value)}
                    min={200}
                    max={250}
                    valueLabelDisplay="auto"
                  />
                </Tooltip>
                
                <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                  Background Threshold ({modelParams.alpha_matting_background_threshold})
                </Typography>
                <Tooltip title="Higher values help preserve logo details">
                  <Slider
                    value={modelParams.alpha_matting_background_threshold}
                    onChange={(_, value) => handleSliderChange('alpha_matting_background_threshold', value)}
                    min={5}
                    max={30}
                    valueLabelDisplay="auto"
                  />
                </Tooltip>
                
                <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                  Erode Size ({modelParams.alpha_matting_erode_size})
                </Typography>
                <Slider
                  value={modelParams.alpha_matting_erode_size}
                  onChange={(_, value) => handleSliderChange('alpha_matting_erode_size', value)}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </>
        )}
        
        {showSAMSettings && (
          <>
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={modelParams.post_process_mask}
                  onChange={handleCheckboxChange}
                  name="post_process_mask"
                />
              }
              label="Post-process Mask (better for logos)"
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Tip: For logos with SAM, try enabling Alpha Matting with a lower foreground threshold (220) 
              and a higher background threshold (20) to preserve more details.
            </Typography>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ModelSettingsPanel;