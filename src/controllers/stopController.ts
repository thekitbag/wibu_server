import { Request, Response } from 'express';
import { prisma } from '../server';

/**
 * Creates a new stop for a journey
 * Validates required fields and automatically assigns the next order position
 */
/**
 * Formats external URL by adding https:// prefix if missing
 * @param url - The URL to format
 * @returns Formatted URL with https:// prefix or null if empty
 */
const formatExternalUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Check if URL already has a protocol (http:// or https://)
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // Prepend https:// if no protocol is present
  return `https://${trimmedUrl}`;
};

/**
 * Allowed icon names for stops
 */
const ALLOWED_ICONS = ['Plane', 'Hotel', 'Restaurant', 'Gift', 'Heart'] as const;

/**
 * Validates that exactly one of image_url or icon_name is provided
 * @param image_url - The image URL
 * @param icon_name - The icon name
 * @returns Object with validation result and error message if invalid
 */
const validateImageOrIcon = (image_url: string | null | undefined, icon_name: string | null | undefined): { isValid: boolean; error?: string } => {
  const hasImage = image_url && image_url.trim() !== '';
  const hasIcon = icon_name && icon_name.trim() !== '';

  if (!hasImage && !hasIcon) {
    return { isValid: false, error: 'Either image_url or icon_name is required' };
  }

  if (hasImage && hasIcon) {
    return { isValid: false, error: 'Cannot provide both image_url and icon_name' };
  }

  if (hasIcon && !ALLOWED_ICONS.map(icon => icon.toLowerCase()).includes(icon_name!.trim().toLowerCase())) {
    return { isValid: false, error: `Invalid icon name. Allowed icons: ${ALLOWED_ICONS.join(', ')}` };
  }

  return { isValid: true };
};

export const createStop = async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;
    const { title, note, image_url, icon_name, external_url } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate that exactly one of image_url or icon_name is provided
    const imageIconValidation = validateImageOrIcon(image_url, icon_name);
    if (!imageIconValidation.isValid) {
      return res.status(400).json({ error: imageIconValidation.error });
    }

    // Format external URL by adding https:// if missing
    const formattedExternalUrl = formatExternalUrl(external_url);

    // Clean up the input values
    const cleanImageUrl = image_url && image_url.trim() !== '' ? image_url.trim() : null;
    // Normalize icon name to proper case (find matching icon from allowed list)
    const cleanIconName = icon_name && icon_name.trim() !== ''
      ? ALLOWED_ICONS.find(allowedIcon => allowedIcon.toLowerCase() === icon_name.trim().toLowerCase()) || null
      : null;

    // Verify the parent journey exists before creating the stop
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId }
    });

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Calculate the order position for the new stop
    // This ensures stops are added sequentially (1, 2, 3, etc.)
    const existingStopsCount = await prisma.stop.count({
      where: { journeyId }
    });

    const newOrder = existingStopsCount + 1;

    // Create the new stop with calculated order position
    const stop = await prisma.stop.create({
      data: {
        title,
        note,
        image_url: cleanImageUrl,
        icon_name: cleanIconName,
        external_url: formattedExternalUrl,
        order: newOrder,
        journeyId
      }
    });

    // Return the created stop data
    res.status(201).json({
      id: stop.id,
      title: stop.title,
      note: stop.note,
      image_url: stop.image_url,
      icon_name: stop.icon_name,
      external_url: stop.external_url,
      order: stop.order,
      journeyId: stop.journeyId
    });
  } catch (error) {
    console.error('Error creating stop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};