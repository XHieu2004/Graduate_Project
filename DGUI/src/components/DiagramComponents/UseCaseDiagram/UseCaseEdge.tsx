import React from 'react';
import { EdgeProps, getStraightPath, EdgeLabelRenderer } from '@xyflow/react';
import { UseCaseRelationship } from '../../../models/UsecaseDiagram';

interface UseCaseEdgeProps extends EdgeProps {
    data?: {
        relationship: UseCaseRelationship;
    };
}

const UseCaseEdge = ({ 
    id, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    style = {},
    markerEnd,
    selected,
    data
}: UseCaseEdgeProps) => {
    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    // Calculate label position
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    // Get relationship type from data
    const relationship = data?.relationship;
    const relationshipType = relationship?.type || 'association';
    
    // Different styles based on relationship type
    const getEdgeStyle = () => {
        const baseStyle = {
            fill: 'none',
            strokeWidth: selected ? 4 : 3,
            ...style
        };

        switch (relationshipType) {
            case 'includes':
                return {
                    ...baseStyle,
                    stroke: selected ? '#dc2626' : '#ef4444',
                    strokeDasharray: '8,4',
                    strokeWidth: selected ? 4 : 3
                };
            case 'extends':
                return {
                    ...baseStyle,
                    stroke: selected ? '#7c3aed' : '#8b5cf6',
                    strokeDasharray: '10,5',
                    strokeWidth: selected ? 4 : 3
                };
            case 'generalizes':
                return {
                    ...baseStyle,
                    stroke: selected ? '#059669' : '#10b981',
                    strokeWidth: selected ? 5 : 4
                };
            default: // 'association'
                return {
                    ...baseStyle,
                    stroke: selected ? '#1e40af' : '#374151',
                    strokeWidth: selected ? 4 : 3
                };
        }
    };

    // Get the arrow type based on relationship
    const getArrowType = () => {
        if (relationshipType === 'generalizes') {
            return 'triangle'; // Hollow triangle for generalization
        }
        return 'arrow'; // Solid arrow for association, includes, extends
    };

    return (
        <>
            {/* Define custom arrow markers */}
            <defs>
                <marker
                    id={`arrow-${id}`}
                    viewBox="0 0 16 12"
                    refX="15"
                    refY="6"
                    markerWidth="12"
                    markerHeight="10"
                    orient="auto"
                >
                    <polygon
                        points="0 2, 14 6, 0 10"
                        fill={getEdgeStyle().stroke}
                        stroke={getEdgeStyle().stroke}
                        strokeWidth="1"
                    />
                </marker>
                <marker
                    id={`triangle-marker-${id}`}
                    viewBox="0 0 14 10"
                    refX="13"
                    refY="5"
                    markerWidth="10"
                    markerHeight="8"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 14 5, 0 10"
                        fill="none"
                        stroke={getEdgeStyle().stroke}
                        strokeWidth="2"
                    />
                </marker>
            </defs>
            
            {/* Background stroke for better visibility */}
            <path
                d={edgePath}
                fill="none"
                stroke="white"
                strokeWidth={(selected ? 4 : 3) + 2}
                className="react-flow__edge-path"
                style={{ opacity: 0.8 }}
            />
            
            <path
                id={id}
                style={getEdgeStyle()}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={getArrowType() === 'triangle' ? `url(#triangle-marker-${id})` : `url(#arrow-${id})`}
                filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))"
            />
            
            {/* Add an invisible wider path for easier clicking */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth="15"
                className="react-flow__edge-interaction"
            />
            
            {/* Relationship label */}
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: getEdgeStyle().stroke,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${getEdgeStyle().stroke}`,
                        pointerEvents: 'none',
                        zIndex: 10
                    }}
                >
                    {relationshipType === 'association' ? '' : 
                     relationshipType === 'includes' ? '<<include>>' :
                     relationshipType === 'extends' ? '<<extend>>' :
                     relationshipType === 'generalizes' ? '' : relationshipType}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default UseCaseEdge;
