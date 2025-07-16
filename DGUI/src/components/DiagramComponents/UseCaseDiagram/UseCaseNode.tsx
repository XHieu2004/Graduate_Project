import React, { useState, useEffect } from 'react';
import { NodeProps, Position, Handle, Node } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { UseCase } from "../../../models/UsecaseDiagram";
import { useUseCaseDiagramContext } from '../../../provider/diagram_providers/UseCaseDiagramProvider';

type UseCaseNode = Node<{ useCase: UseCase }, 'useCase'>;

const UseCaseNode = ({ data, selected, id }: NodeProps<UseCaseNode>) => {
    const { updateUseCase, deleteUseCaseNode, edges, deleteEdge } = useUseCaseDiagramContext();

    const [localUseCase, setLocalUseCase] = useState<UseCase>(data.useCase);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        updateUseCase(id, localUseCase);
    }, [id, localUseCase, updateUseCase]);

    useEffect(() => {
        if (!selected) {
            setIsExpanded(false);
        }
    }, [selected]);

    const handleUseCaseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalUseCase(prev => ({ ...prev, name: e.target.value }));
    };

    const handleUseCaseDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalUseCase(prev => ({ ...prev, description: e.target.value }));
    };

    const toggleExpanded = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleDeleteNode = (e: React.MouseEvent) => {
        e.stopPropagation();

        const connectedEdges = edges.filter((edge: any) => edge.source === id || edge.target === id);

        connectedEdges.forEach((edge: any) => {
            deleteEdge(edge.id);
        });
        deleteUseCaseNode(id);
    };

    if (!isExpanded) {
        return (
            <div 
                className="relative flex items-center justify-center shadow-xl"
                style={{
                    width: '140px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#f0fdf4',
                    border: '3px solid #16a34a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(34, 197, 94, 0.1)',
                }}
            >
                {/* Handles for connections */}
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Top} id="a" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Top} id="a-target" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Right} id="b" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Right} id="b-target" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Bottom} id="c" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Bottom} id="c-target" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Left} id="d" />
                <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Left} id="d-target" />

                {/* Control buttons */}
                <button
                    className="nodrag absolute top-1 left-2 bg-green-600 hover:bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs focus:outline-none"
                    onClick={toggleExpanded}
                >
                    +
                </button>
                <button
                    className="nodrag absolute top-1 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs focus:outline-none"
                    onClick={handleDeleteNode}
                >
                    ×
                </button>

                {/* Use Case Content */}
                <div className="text-center px-4 py-2 drag-handle_custom cursor-move">
                    <div className="text-sm font-medium text-green-800 break-words leading-tight">
                        {localUseCase.name || 'Use Case'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-300 rounded-lg bg-green-50 flex flex-col shadow-md overflow-hidden w-64">
            {/* Handles for connections */}
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Top} id="a" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Top} id="a-target" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Right} id="b" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Right} id="b-target" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Bottom} id="c" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Bottom} id="c-target" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="source" position={Position.Left} id="d" />
            <Handle className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-md" type="target" position={Position.Left} id="d-target" />

            {/* Header with drag handle and collapse button */}
            <div className="relative">
                <div className="drag-handle_custom h-6 bg-green-500 cursor-move rounded-t-lg"></div>
                <button
                    className="nodrag absolute left-1 top-1 bg-green-600 hover:bg-green-700 text-white rounded w-4 h-4 flex items-center justify-center text-xs focus:outline-none"
                    onClick={toggleExpanded}
                >
                    -
                </button>
                <button
                    className="nodrag absolute right-1 top-1 bg-red-600 hover:bg-red-700 text-white rounded w-4 h-4 flex items-center justify-center text-xs focus:outline-none"
                    onClick={handleDeleteNode}
                >
                    ×
                </button>
            </div>

            {/* Use Case Body - Expanded */}
            <div className="p-3 flex flex-col">
                {/* Use Case Name Input */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-green-800 mb-1">Use Case Name</label>
                    <input
                        type="text"
                        value={localUseCase.name}
                        onChange={handleUseCaseNameChange}
                        className="nodrag w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Enter use case name"
                    />
                </div>

                {/* Use Case Description Input */}
                <div className="mb-2">
                    <label className="block text-xs font-medium text-green-800 mb-1">Description</label>
                    <textarea
                        value={localUseCase.description}
                        onChange={handleUseCaseDescriptionChange}
                        className="nodrag w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                        placeholder="Enter use case description"
                        rows={3}
                    />
                </div>
            </div>
        </div>
    );
};

export default UseCaseNode;
