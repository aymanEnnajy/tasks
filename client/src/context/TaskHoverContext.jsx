import React, { createContext, useContext, useState } from 'react';

const TaskHoverContext = createContext();

export const TaskHoverProvider = ({ children }) => {
    const [hoveredTaskId, setHoveredTaskId] = useState(null);

    return (
        <TaskHoverContext.Provider value={{ hoveredTaskId, setHoveredTaskId }}>
            {children}
        </TaskHoverContext.Provider>
    );
};

export const useTaskHover = () => {
    const context = useContext(TaskHoverContext);
    if (!context) {
        throw new Error('useTaskHover must be used within TaskHoverProvider');
    }
    return context;
};
