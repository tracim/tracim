import React, { type PropsWithChildren, type SyntheticEvent } from "react"
import { createPortal } from "react-dom"
import './Popup.css'

export interface PopupProps {
    isOpen: boolean
    onClosePopup: React.EventHandler<SyntheticEvent>
}

export default function Popup({ isOpen, children, onClosePopup }: PropsWithChildren<PopupProps>) {
    return <>
        {isOpen && createPortal(
            <div className="popup-overlay" onClick={e => { onClosePopup(e); e.preventDefault() }}>
                <div className="popup-frame" onClick={e => e.stopPropagation()}>
                    {children}
                </div>
            </div>,
            document.body
        )}
    </>
}