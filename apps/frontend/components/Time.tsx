"use client";
import { useEffect, useState } from "react";

const Time = () => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setTime(Date.now()));
        return () => clearInterval(id);
    }, []);

    return <div>{new Date(time).toISOString()}</div>;
};

export default Time;
