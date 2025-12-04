# Prompt Enhancement Guide

## Overview

The Nova Reel Media Generator includes an intelligent prompt enhancement system that automatically improves user prompts to generate more realistic, high-quality images and videos.

## How It Works

### Automatic Enhancement

Every prompt submitted to the system is automatically enhanced before being sent to the AI model. This happens transparently in the backend.

### Enhancement Process

1. **Validation** - Prompt is validated and cleaned
2. **Style Selection** - Appropriate style is chosen based on media type
3. **Keyword Addition** - Professional keywords are added
4. **Quality Modifiers** - High-quality descriptors are included
5. **Logging** - Original and enhanced prompts are logged for debugging

## Enhancement Styles

### Photorealistic (Images)

**Keywords Added:**
- photorealistic
- highly detailed
- professional photography
- 8k resolution
- sharp focus
- realistic lighting
- natural colors
- high quality
- masterpiece
- best quality

**Example:**
```
Input:  "a cat sitting on a windowsill"
Output: "a cat sitting on a windowsill, photorealistic, highly detailed, 
         professional photography, 8k resolution, sharp focus, realistic 
         lighting, natural colors, high quality, masterpiece, best quality"
```

### Cinematic (Videos)

**Keywords Added:**
- cinematic
- film quality
- dramatic lighting
- depth of field
- professional color grading
- high production value
- smooth motion
- stable camera
- professional video quality

**Example:**
```
Input:  "waves crashing on beach"
Output: "waves crashing on beach, cinematic, film quality, dramatic lighting, 
         depth of field, professional color grading, high production value, 
         high quality, masterpiece, best quality, smooth motion, stable camera, 
         professional video quality"
```

### Artistic (Creative Content)

**Keywords Added:**
- artistic
- creative composition
- vibrant colors
- professional quality

## Smart Enhancement

### When Enhancement is Minimal

The system detects when a prompt is already detailed (>200 characters) and applies minimal enhancement to preserve the user's specific instructions.

### When Enhancement is Full

For shorter prompts (<200 characters), full enhancement is applied to maximize quality.

## Validation Rules

### Length Requirements
- **Minimum:** 3 characters
- **Maximum:** 500 characters (before enhancement)

### Content Filtering

The system filters out inappropriate content including:
- NSFW terms
- Explicit content
- Violence/gore references
- Other inappropriate keywords

### Automatic Cleaning
- Removes extra whitespace
- Normalizes spacing
- Trims leading/trailing spaces

## Best Practices

### Writing Good Prompts

1. **Be Specific**
   - ❌ "a dog"
   - ✅ "a golden retriever playing in a park"

2. **Include Context**
   - ❌ "mountain"
   - ✅ "snow-capped mountain at sunrise"

3. **Describe Lighting**
   - ❌ "person walking"
   - ✅ "person walking in golden hour lighting"

4. **Mention Camera Angle (for videos)**
   - ❌ "car driving"
   - ✅ "car driving, wide angle shot from above"

5. **Add Mood/Atmosphere**
   - ❌ "forest"
   - ✅ "misty forest with soft morning light"

### What Gets Enhanced Automatically

You don't need to include these - they're added automatically:
- Quality descriptors (high quality, masterpiece, etc.)
- Technical specs (8k, resolution, etc.)
- Professional terms (photography, cinematic, etc.)
- Lighting quality (realistic lighting, dramatic lighting)
- Motion quality (smooth motion, stable camera)

### What You Should Include

Focus on describing:
- **Subject:** What is in the scene
- **Action:** What is happening
- **Setting:** Where it takes place
- **Time:** Time of day, season
- **Mood:** Emotional tone
- **Colors:** Specific color palette
- **Composition:** How elements are arranged

## Examples

### Minimal Prompt → Enhanced

```
Input:  "dog"
Output: "dog, photorealistic, highly detailed, professional photography, 
         8k resolution, sharp focus, realistic lighting, natural colors, 
         high quality, masterpiece, best quality"
```

### Good Prompt → Enhanced

```
Input:  "golden retriever running through autumn leaves in a park"
Output: "golden retriever running through autumn leaves in a park, 
         photorealistic, highly detailed, professional photography, 
         8k resolution, sharp focus, realistic lighting, natural colors, 
         high quality, masterpiece, best quality"
```

### Detailed Prompt → Minimal Enhancement

```
Input:  "A majestic golden retriever with flowing fur running joyfully 
         through a carpet of vibrant orange and red autumn leaves in a 
         sunlit park, with soft bokeh background and warm afternoon light 
         filtering through the trees, captured with shallow depth of field"
         
Output: [Minimal enhancement - prompt is already detailed]
```

## API Usage

### Enhance Endpoint

Test prompt enhancement before generation:

```bash
POST http://localhost:3001/api/prompt/enhance
Content-Type: application/json

{
  "prompt": "your prompt here",
  "style": "photorealistic",
  "quality": "high",
  "mediaType": "image"
}
```

**Response:**
```json
{
  "original": "your prompt here",
  "enhanced": "your prompt here, photorealistic, highly detailed...",
  "suggestions": [
    "Add lighting details",
    "Describe the background or setting",
    "Specify camera angle"
  ]
}
```

## Debugging

### Viewing Enhanced Prompts

Enhanced prompts are logged in the backend console:

```
🔵 [PROMPT ENHANCEMENT]
Original: dog riding a bike
Enhanced: dog riding a bike, photorealistic, highly detailed, professional photography...
```

### Checkpoint Logs

Look for these checkpoints in the backend logs:
- `[IMAGE GEN 1]` - Shows enhanced prompt being used
- `[VIDEO GEN 1]` - Shows enhanced prompt being used

## Tips for Best Results

1. **Start Simple** - Let the enhancement system add quality keywords
2. **Focus on Content** - Describe what you want to see
3. **Add Context** - Include setting, time, mood
4. **Be Specific** - More details = better results
5. **Trust the System** - Don't add quality keywords manually

## Common Issues

### Prompt Too Short
**Error:** "Prompt is too short. Please provide more details."
**Solution:** Add at least 3 characters

### Prompt Too Long
**Error:** "Prompt is too long. Please keep it under 500 characters."
**Solution:** Shorten your prompt or let enhancement handle quality keywords

### Inappropriate Content
**Error:** "Prompt contains inappropriate content."
**Solution:** Remove flagged terms and try again

## Future Enhancements

Planned improvements:
- [ ] User-selectable enhancement levels
- [ ] Custom style presets
- [ ] Negative prompt support
- [ ] Advanced content filtering
- [ ] Multi-language support
- [ ] Prompt templates
- [ ] A/B testing different enhancements
