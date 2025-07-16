import React, { useState, useEffect } from 'react';
import { NodeProps, Position, Handle, Node } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { Actor } from "../../../models/UsecaseDiagram";
import { useUseCaseDiagramContext } from '../../../provider/diagram_providers/UseCaseDiagramProvider';

type ActorNode = Node<{ actor: Actor }, 'actor'>;

const ActorNode = ({ data, selected, id }: NodeProps<ActorNode>) => {
    const { updateActor, deleteActorNode, edges, deleteEdge } = useUseCaseDiagramContext();

    const [localActor, setLocalActor] = useState<Actor>(data.actor);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        updateActor(id, localActor);
    }, [id, localActor, updateActor]);

    useEffect(() => {
        if (!selected) {
            setIsExpanded(false);
        }
    }, [selected]);

    const handleActorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalActor(prev => ({ ...prev, name: e.target.value }));
    };

    const handleActorDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalActor(prev => ({ ...prev, description: e.target.value }));
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
        deleteActorNode(id);
    };

    if (!isExpanded) {
        return (
            <div className="relative flex flex-col items-center justify-center bg-blue-50 shadow-xl rounded-lg p-3 border-3 border-blue-500"
                 style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(59, 130, 246, 0.1)' }}>
                {/* Handles for connections */}
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Top} id="a" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Top} id="a-target" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Right} id="b" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Right} id="b-target" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Bottom} id="c" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Bottom} id="c-target" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Left} id="d" />
                <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Left} id="d-target" />

                {/* Control buttons */}
                <button
                    className="nodrag absolute top-1 left-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs focus:outline-none"
                    onClick={toggleExpanded}
                >
                    +
                </button>
                <button
                    className="nodrag absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs focus:outline-none"
                    onClick={handleDeleteNode}
                >
                    ×
                </button>

                {/* Actor Body */}
                <div className="drag-handle_custom cursor-move flex flex-col items-center">
                    {/* Stick figure representation */}
                    <div className="mb-2">
                        <svg width="30" height="40" viewBox="0 0 30 40" className="text-blue-600">
                            {/* Head */}
                            <circle cx="15" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
                            {/* Body */}
                            <line x1="15" y1="14" x2="15" y2="28" stroke="currentColor" strokeWidth="2"/>
                            {/* Arms */}
                            <line x1="5" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="2"/>
                            {/* Legs */}
                            <line x1="15" y1="28" x2="8" y2="38" stroke="currentColor" strokeWidth="2"/>
                            <line x1="15" y1="28" x2="22" y2="38" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </div>
                    
                    {/* Actor Name */}
                    <div className="text-center text-sm font-medium text-blue-800 break-words max-w-20">
                        {localActor.name || 'Actor'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-300 rounded bg-blue-50 flex flex-col shadow-md overflow-hidden w-64">
            {/* Handles for connections */}
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Top} id="a" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Top} id="a-target" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Right} id="b" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Right} id="b-target" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Bottom} id="c" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Bottom} id="c-target" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="source" position={Position.Left} id="d" />
            <Handle className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md" type="target" position={Position.Left} id="d-target" />

            {/* Header with drag handle and collapse button */}
            <div className="relative">
                <div className="drag-handle_custom h-6 bg-blue-500 cursor-move"></div>
                <button
                    className="nodrag absolute left-1 top-1 bg-blue-600 hover:bg-blue-700 text-white rounded w-4 h-4 flex items-center justify-center text-xs focus:outline-none"
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

            {/* Actor Body - Expanded */}
            <div className="p-3 flex flex-col">
                {/* Stick figure representation */}
                <div className="mb-3 flex justify-center">
                    <svg width="40" height="50" viewBox="0 0 40 50" className="text-blue-600">
                        {/* Head */}
                        <circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                        {/* Body */}
                        <line x1="20" y1="18" x2="20" y2="35" stroke="currentColor" strokeWidth="2"/>
                        {/* Arms */}
                        <line x1="6" y1="25" x2="34" y2="25" stroke="currentColor" strokeWidth="2"/>
                        {/* Legs */}
                        <line x1="20" y1="35" x2="10" y2="47" stroke="currentColor" strokeWidth="2"/>
                        <line x1="20" y1="35" x2="30" y2="47" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </div>

                {/* Actor Name Input */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-blue-800 mb-1">Actor Name</label>
                    <input
                        type="text"
                        value={localActor.name}
                        onChange={handleActorNameChange}
                        className="nodrag w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter actor name"
                    />
                </div>

                {/* Actor Description Input */}
                <div className="mb-2">
                    <label className="block text-xs font-medium text-blue-800 mb-1">Description</label>
                    <textarea
                        value={localActor.description}
                        onChange={handleActorDescriptionChange}
                        className="nodrag w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="Enter actor description"
                        rows={3}
                    />
                </div>
            </div>
        </div>
    );
};

export default ActorNode;
