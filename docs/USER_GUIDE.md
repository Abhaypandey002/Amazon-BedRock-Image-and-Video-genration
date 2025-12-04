# Nova Reel Media Generator - User Guide

Welcome to the Nova Reel Media Generator! This guide will help you get started with creating amazing videos and images using AI.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Generating Content](#generating-content)
3. [Managing History](#managing-history)
4. [Tips for Best Results](#tips-for-best-results)
5. [FAQ](#faq)

## Getting Started

### Accessing the Application

1. Open your web browser
2. Navigate to `http://localhost:5173` (or your deployed URL)
3. You'll see the main generation page with three modes to choose from

### Understanding the Interface

The application has two main sections:

- **Generate**: Create new videos and images
- **History**: View and manage your previous generations

## Generating Content

### Text-to-Video

Create videos from text descriptions.

**Steps:**

1. Click on the **"Text to Video"** mode button
2. Enter your prompt in the text area
   - Be descriptive and specific
   - Example: "A peaceful mountain landscape at sunrise with mist rolling over the valleys"
3. (Optional) Adjust parameters:
   - **Aspect Ratio**: Choose 16:9 (landscape), 9:16 (portrait), or 1:1 (square)
   - **Quality**: Select Standard or High
4. Click **"Generate"**
5. Wait for the generation to complete (this may take a few minutes)
6. View your video and click **"Download"** to save it

**Example Prompts:**
- "A time-lapse of a bustling city street from day to night"
- "Underwater scene with colorful coral reefs and tropical fish"
- "A cozy cabin in the woods during a gentle snowfall"

### Image-to-Video

Transform static images into dynamic videos.

**Steps:**

1. Click on the **"Image to Video"** mode button
2. Upload your image:
   - Drag and drop an image into the upload area, OR
   - Click the upload area to browse and select a file
3. Enter a prompt describing how you want the image animated
   - Example: "Add gentle movement and bring this scene to life"
4. (Optional) Adjust parameters
5. Click **"Generate"**
6. Wait for processing
7. View the result showing both your original image and the generated video

**Supported Image Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- PDF (.pdf)

**File Size Limit:** 10MB

**Example Prompts:**
- "Make the clouds move across the sky"
- "Add a subtle zoom effect to emphasize the subject"
- "Create a parallax effect with depth"

### Text-to-Image

Generate images from text descriptions.

**Steps:**

1. Click on the **"Text to Image"** mode button
2. Enter your prompt
   - Be specific about style, colors, and composition
   - Example: "A minimalist logo design featuring a mountain peak in blue and white"
3. (Optional) Select quality level
4. Click **"Generate"**
5. View and download your image

**Example Prompts:**
- "A watercolor painting of a garden in spring"
- "A futuristic robot in a cyberpunk city, neon lighting"
- "An abstract geometric pattern in warm colors"

## Managing History

### Viewing Your History

1. Click **"History"** in the navigation bar
2. Browse through your previous generations
3. Each item shows:
   - Generation type (icon)
   - Prompt used
   - Creation date and time
   - Status (Completed/Failed)

### Viewing Details

1. Click on any history item
2. The right panel will show:
   - Full prompt
   - Generated media with playback controls
   - Original source image (for image-to-video)
   - Metadata (file size, duration, dimensions)

### Downloading from History

1. Select a history item
2. Click the **"Download"** button in the detail view
3. The file will be saved to your downloads folder

### Deleting Items

1. Click the trash icon on any history item
2. Click again to confirm deletion
3. The item and its associated media will be permanently removed

### Refreshing History

Click the **"Refresh"** button at the top of the history page to reload the list.

## Tips for Best Results

### Writing Effective Prompts

**Be Specific:**
- ❌ "A landscape"
- ✅ "A mountain landscape at golden hour with pine trees in the foreground"

**Include Details:**
- Describe the mood, lighting, colors, and style
- Mention specific elements you want to see
- Specify camera angles or perspectives

**Use Clear Language:**
- Avoid ambiguous terms
- Use descriptive adjectives
- Break complex ideas into clear sentences

### Prompt Structure

A good prompt typically includes:

1. **Subject**: What is the main focus?
2. **Setting**: Where is it located?
3. **Style**: What aesthetic or mood?
4. **Details**: Specific elements, colors, lighting

**Example:**
"A serene Japanese garden (subject) in Kyoto (setting), captured in a cinematic style (style) with cherry blossoms, a wooden bridge, and soft morning light (details)"

### Choosing Parameters

**Aspect Ratio:**
- **16:9**: Best for landscape videos, YouTube, presentations
- **9:16**: Perfect for mobile, Instagram Stories, TikTok
- **1:1**: Ideal for Instagram posts, profile pictures

**Quality:**
- **Standard**: Faster generation, good for testing
- **High**: Better quality, takes longer

### Image Upload Tips

**For Best Results:**
- Use high-resolution images (but under 10MB)
- Ensure good lighting and clarity
- Avoid heavily compressed or pixelated images
- Center your subject in the frame

**PDF Documents:**
- The system will extract content from PDFs
- Works best with image-heavy PDFs
- Text-only PDFs may not produce optimal results

## FAQ

### How long does generation take?

- **Text-to-Video**: 2-5 minutes
- **Image-to-Video**: 3-6 minutes
- **Text-to-Image**: 1-3 minutes

Times may vary based on complexity and server load.

### What if generation fails?

1. Check your internet connection
2. Try a simpler prompt
3. Ensure uploaded files meet requirements
4. Click "Try Again" to retry
5. Check the error message for specific guidance

### Can I edit generated content?

The application generates final content. To make changes:
1. Modify your prompt
2. Generate again
3. Compare results in your history

### How much does it cost?

Costs depend on your AWS Bedrock usage. Check your AWS billing dashboard for details.

### Can I use generated content commercially?

Review Amazon Nova Reel's terms of service and your AWS agreement for usage rights.

### Why is my prompt rejected?

Prompts may be rejected if they:
- Exceed 512 tokens (~2000 characters)
- Contain inappropriate content
- Are empty or too vague

### Can I generate multiple items at once?

Currently, the application processes one generation at a time. You can queue multiple generations by submitting them sequentially.

### Where are my files stored?

- Generated media is stored on the server
- History is saved in a local database
- Downloads are saved to your browser's download folder

### How do I delete my data?

Use the delete button in the History page to remove individual items. This deletes both the database record and the media file.

### The interface looks different on my device

The application is responsive and adapts to different screen sizes. Some features may be arranged differently on tablets vs. desktops.

### Can I share my generations?

Yes! Download the media and share it through your preferred platform. The application doesn't have built-in sharing features yet.

## Troubleshooting

### "Network Error" Message

- Check your internet connection
- Verify the backend server is running
- Try refreshing the page

### Upload Fails

- Ensure file is under 10MB
- Check file format is supported
- Try a different file

### Video Won't Play

- Try a different browser
- Check browser console for errors
- Download and play locally

### Generation Stuck

- Wait for the timeout (5 minutes)
- Refresh the page
- Try again with a simpler prompt

## Getting Help

If you encounter issues:

1. Check this guide's FAQ section
2. Review the troubleshooting section in README.md
3. Check the browser console for error messages
4. Verify your AWS credentials are configured correctly

## Best Practices

1. **Start Simple**: Test with simple prompts before complex ones
2. **Save Favorites**: Download content you like immediately
3. **Experiment**: Try different prompts and parameters
4. **Learn from History**: Review successful generations for inspiration
5. **Be Patient**: Quality generation takes time

## Keyboard Shortcuts

- **Enter** in prompt field: Submit form (when valid)
- **Escape**: Close modals/dialogs
- **Tab**: Navigate between form fields

## Accessibility

The application includes:
- Keyboard navigation support
- Screen reader friendly labels
- High contrast mode support (via system preferences)
- Responsive text sizing

---

**Happy Creating!** 🎬🎨

For technical documentation, see [API.md](./API.md)
