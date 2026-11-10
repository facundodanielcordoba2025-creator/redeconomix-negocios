import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// This assertion is necessary because TypeScript can't guarantee that find()
// will return a value. In our case, we are sure the IDs exist.
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
