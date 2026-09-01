import type React from 'react';
import type { TruckRequest } from '../types';
type Props = {
    request: TruckRequest;
    onClose: () => void;
    onNotice: (message: string) => void;
    position: {
        x: number;
        y: number;
    };
    onPositionChange: (position: {
        x: number;
        y: number;
    }) => void;
};
export declare function LinehaulRequestDetailsPanel({ request, onClose, onNotice, position, onPositionChange }: Props): React.JSX.Element;
export {};
