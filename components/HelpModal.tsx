
import React from 'react';
import { useTranslations } from '../contexts/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#FDF6E3] border-2 border-black shadow-[4px_4px_0_0_#000] p-6 w-full max-w-2xl flex flex-col gap-4 max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-black">{t.helpTitle}</h2>
            <button 
              onClick={onClose}
              className="bg-gray-200 text-black border-2 border-black h-8 w-8 flex items-center justify-center font-bold text-xl hover:bg-gray-300 transition"
            >
              &times;
            </button>
        </div>
        <div className="text-base text-gray-800 space-y-6 overflow-y-auto pr-2">
            <div>
                <h3 className="text-lg font-semibold text-[#2E7D73] mb-2">{t.helpApiTitle}</h3>
                <p className="text-black">{t.helpApiStep1}</p>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-[#2E7D73] mb-2">{t.helpUsageTitle}</h3>
                <p className="mb-3">{t.helpUsageDesc1}</p>
                <div className="space-y-4">
                    <div className="bg-black/5 p-3 border border-black">
                        <p className="font-semibold text-black">{t.helpUsageBasicTitle}</p>
                        <p className="text-sm text-gray-700">{t.helpUsageBasicDesc}</p>
                    </div>
                     <div className="bg-black/5 p-3 border border-black">
                        <p className="font-semibold text-black">{t.helpUsagePresetsTitle}</p>
                        <p className="text-sm text-gray-700 mb-2">{t.helpUsagePresetsDesc}</p>
                        {/* FIX: Removed a list item that was referencing a non-existent preset ('Expression Changer') and its corresponding translation key to fix a compilation error. */}
                        <ul className="list-disc list-inside space-y-1 pl-2 text-black text-sm">
                           <li><span className="font-semibold">{t.presetAngleChangerName}:</span> {t.helpPresetAngle}</li>
                        </ul>
                    </div>
                     <div className="bg-black/5 p-3 border border-black">
                        <p className="font-semibold text-black">{t.helpUsageMultiImageTitle}</p>
                        <p className="text-sm text-gray-700">{t.helpUsageMultiImageDesc}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-[#2E7D73] mb-2">{t.helpFeaturesTitle}</h3>
                 <ul className="list-disc list-inside space-y-2 pl-2 text-black">
                    <li><span className="font-semibold">{t.helpFeatureModelTitle}:</span> {t.helpFeatureModelDesc}</li>
                    <li><span className="font-semibold">{t.helpFeatureResolutionTitle}:</span> {t.helpFeatureResolutionDesc}</li>
                    <li><span className="font-semibold">{t.helpFeatureAspectRatioTitle}:</span> {t.helpFeatureAspectRatioDesc}</li>
                    <li><span className="font-semibold">{t.helpFeatureCreativityTitle}:</span> {t.helpFeatureCreativityDesc}</li>
                    <li><span className="font-semibold">{t.helpFeatureOutputsTitle}:</span> {t.helpFeatureOutputsDesc}</li>
                </ul>
            </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
            <button onClick={onClose} className="bg-[#2E7D73] hover:bg-[#25645c] text-white font-bold py-2 px-4 border-2 border-black shadow-[3px_3px_0_0_#000] transition-all duration-100 ease-in-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">
                {t.closeButton}
            </button>
        </div>
      </div>
    </div>
  );
};