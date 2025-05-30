import React, { ChangeEvent, useEffect, useState } from 'react'

type TextInputWithOptionsProps = {
    value: string
    options?: string[]
    onChange?: (value: string) => void
    onBlur?: (value: string) => void
}

export const TextInputWithOptions: React.FC<TextInputWithOptionsProps> = ({
    value,
    options,
    onChange,
    onBlur,
}) => {
    const [inputValue, setInputValue] = useState(value)

    useEffect(() => {
        setInputValue(value)
    }, [value])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        onChange?.(value)
    }

    const handleBlur = () => {
        onBlur?.(inputValue)
    }

    return (
        <div className="text-input-container">
            <input
                className="text-input"
                list={options ? 'options' : ''}
                id="custom-input"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
            />
            {options && (
                <datalist id="options">
                    {options.map((option, index) => {
                        return <option key={index} value={option} />
                    })}
                </datalist>
            )}
        </div>
    )
}
