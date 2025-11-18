"use client"

import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

interface MessageInputProps {
    placeholder?: string
    id: string
    type?: string
    required?: boolean
    register: UseFormRegister<FieldValues>
    errors: FieldErrors
    maxLength?: number
    disabled?: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({
    placeholder,
    id,
    type,
    required,
    register,
    errors,
    maxLength = 5000,
    disabled
}) => {
    return (
        <div className="w-full">
            <input
                id={id}
                type={type}
                autoComplete={id}
                disabled={disabled}
                {...register(id, { 
                    required,
                    maxLength: {
                        value: maxLength, 
                        message: `Message cannot exceed ${maxLength} characters`
                    }
                })}
                placeholder={placeholder}
                maxLength={maxLength} 
                className={`w-full bg-transparent text-sm border border-grey-600 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-red-600 shadow-sm focus:shadow ${
                    !disabled ? "hover:border-red-600" : ""
                }`}
            />
        </div>
    );
}

export default MessageInput;
