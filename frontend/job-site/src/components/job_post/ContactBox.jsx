import { useState } from "react";
import capitalize from "../../utils/Capitalize";

function ContactBox({ contact, availableTypes, onChange, onRemove, canRemove }) {

    const convertTypeToString = (type) => {
        if (type == "email"){
            return "อีเมลล์"
        } else if (type == "tel"){
            return "เบอร์โทร"            
        } else {
            return capitalize(type)
        }
    }

    return (
        <div className="flex flex-row justify-between">
            <select
                value={contact.type}
                onChange={(e) => onChange("type", e.target.value)}
                className="border p-1 rounded w-fit mr-2 shadow border-gray-300 text-gray-500"
            >
                {availableTypes.map(type => (
                    <option key={type} value={type}>
                        {convertTypeToString(type)}
                    </option>
                ))}
            </select>

            <input
                type="text"
                value={contact.value}
                onChange={(e) => onChange("value", e.target.value)}
                className="border p-1 rounded w-full shadow border-gray-300"
            />

            {canRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-2 text-white bg-red-500 px-4 py-0.5 rounded cursor-pointer hover:bg-red-400 shadow"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export default ContactBox;
