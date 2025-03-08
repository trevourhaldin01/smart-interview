import { useState, useEffect } from "react"

export default function useLocalStorage(key: string, initialValue: any) {
    const [storedValue, setStoredValue] = useState(()=>{
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    })

    useEffect(()=>{
        localStorage.setItem(key, JSON.stringify(storedValue));
    },[key,storedValue]);

    return [storedValue, setStoredValue];

}