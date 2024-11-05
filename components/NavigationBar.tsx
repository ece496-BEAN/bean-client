'use client'

import React, { useRef, useState } from "react";
import { Home, PieChart, Camera, DollarSign, Settings } from 'lucide-react'
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import Image from "next/image";

export const NavigationBar: React.FC = () => {
    const router = useRouter();
    const [image, setImage] = useState<string | null>("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setImage(reader.result as string);
                // Handle additional logic for the uploaded image (e.g., display, process, etc.)
            };

            reader.readAsDataURL(file);
        }
    };

    const openFilePicker = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white shadow-lg">
            <ul className="flex justify-around items-center h-16">
                <li>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-indigo-600"
                        onClick={() => router.push("/home")}
                    >
                        <Home className="w-6 h-6" />
                    </Button>
                </li>
                <li>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-indigo-600"
                        onClick={() => router.push("/budget")}
                    >
                        <PieChart className="w-6 h-6" />
                    </Button>
                </li>
                <li>
                    <Button
                        variant="default"
                        size="icon"
                        className="w-16 h-16 rounded-full -mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700"
                        onClick={openFilePicker}
                    >
                        <Camera className="w-8 h-8" />
                    </Button>
                </li>
                <li>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-indigo-600"
                        onClick={() => router.push("/transactions")}
                    >
                        <DollarSign className="w-6 h-6" />
                    </Button>
                </li>
                <li>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-indigo-600"
                        onClick={() => router.push("/settings")}
                    >
                        <Settings className="w-6 h-6" />
                    </Button>
                </li>
            </ul>

            {/* Hidden file input for image capture */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment" // Opens camera on mobile devices
                style={{ display: "none" }} // Hidden input
                onChange={handleImageUpload}
            />

            {/* Optionally display the uploaded image */}
            {image && (
                <div>
                    <h3>Uploaded Image:</h3>
                    <Image src={image} alt="Uploaded" />
                </div>
            )}
        </nav>
    );
};

export default NavigationBar;
