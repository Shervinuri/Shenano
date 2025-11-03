/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {ArrowPathIcon, DownloadIcon, PlusIcon} from './icons';

interface ImageResultProps {
  imageUrl: string;
  onRetry: () => void;
  onNewImage: () => void;
  modelName: string;
}

const ImageResult: React.FC<ImageResultProps> = ({
  imageUrl,
  onRetry,
  onNewImage,
  modelName,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-8 p-8 bg-gradient-to-br from-yellow-600/20 via-black to-black rounded-lg border border-yellow-800/60 shadow-2xl mt-6">
      <h2 className="text-2xl font-bold text-gray-200">
        Your Image is Ready!
      </h2>
      <div className="w-full max-w-lg rounded-lg overflow-hidden bg-black shadow-lg">
        <img
          src={imageUrl}
          alt="Generated result"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
            <ArrowPathIcon className="w-5 h-5" />
            Retry
          </button>
          <a
            href={imageUrl}
            download="shen_studio_image.png"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
            <DownloadIcon className="w-5 h-5" />
            Download
          </a>
          <button
            onClick={onNewImage}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            <PlusIcon className="w-5 h-5" />
            New Creation
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Generated with: <span className="font-mono">{modelName}</span>
        </p>
      </div>
    </div>
  );
};

export default ImageResult;