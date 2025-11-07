
import React from 'react';
import { Material } from '../types';
// FIX: Corrected icon import path to resolve file casing issue.
import { LeafIcon, ShieldIcon, DollarSignIcon } from './Icons';

interface MaterialCardProps {
  material: Material;
  imageUrl: string | null;
}

const ImagePlaceholder = () => (
    <div className="w-full h-64 bg-gray-200 animate-pulse flex items-center justify-center rounded-t-lg">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"></path></svg>
    </div>
);

const PropertyPill: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-full text-sm">
        <span className="text-gray-500">{icon}</span>
        <div>
            <span className="font-semibold text-gray-800">{label}:</span>
            <span className="text-gray-600 ml-1">{value}</span>
        </div>
    </div>
);


const MaterialCard: React.FC<MaterialCardProps> = ({ material, imageUrl }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col">
      {imageUrl ? (
        <img src={imageUrl} alt={`AI generated image of ${material.name}`} className="w-full h-64 object-cover" />
      ) : (
        <ImagePlaceholder />
      )}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{material.name}</h3>
        {/* FIX: The `description` property is optional, so provide a fallback. */}
        <p className="text-gray-600 mb-4 flex-grow">{material.description || 'No description available.'}</p>
        
        <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Key Properties</h4>
            <div className="flex flex-wrap gap-2">
                {/* FIX: The `properties` property is optional, use optional chaining and provide fallbacks. */}
                <PropertyPill icon={<LeafIcon className="w-4 h-4" />} label="Sustainability" value={material.properties?.sustainability || 'N/A'} />
                <PropertyPill icon={<ShieldIcon className="w-4 h-4" />} label="Durability" value={material.properties?.durability || 'N/A'} />
                <PropertyPill icon={<DollarSignIcon className="w-4 h-4" />} label="Cost" value={material.properties?.cost || 'N/A'} />
            </div>
        </div>

        <div>
            <h4 className="font-semibold text-gray-700 mb-2">Common Uses</h4>
            <div className="flex flex-wrap gap-2">
                {/* FIX: The `commonUses` property is optional, check for its existence before mapping. */}
                {material.commonUses?.map((use, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">{use}</span>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;