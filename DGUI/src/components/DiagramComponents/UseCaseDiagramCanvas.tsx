import { useRef, useCallback, useState } from 'react';
import '@xyflow/react/dist/base.css';
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    ConnectionMode,
    FitViewOptions,
    DefaultEdgeOptions,
    EdgeMouseHandler,
    Connection,
} from '@xyflow/react';
import ActorNode from './UseCaseDiagram/ActorNode';
import UseCaseNode from './UseCaseDiagram/UseCaseNode';
import UseCaseEdge from './UseCaseDiagram/UseCaseEdge';
import { Button, Menu, MenuItem, Select, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { UseCaseDiagram } from '../../models/UsecaseDiagram';
import { useUseCaseDiagramContext, UseCaseDiagramProvider } from '../../provider/diagram_providers/UseCaseDiagramProvider';
import { autoArrange, gridLayout, circleLayout, forceDirectedLayout, LayoutOptions } from '../../utils/Arrange';

const nodeTypes = {
    actor: ActorNode,
    useCase: UseCaseNode,
};

const edgeTypes = {
    default: UseCaseEdge,
};

const fitViewOptions: FitViewOptions = {
    padding: 0.2,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
    animated: false,
    style: { 
        stroke: '#374151',
        strokeWidth: 2,
        strokeDasharray: '0'
    },
    interactionWidth: 20,
    type: 'default'
};

interface UseCaseDiagramCanvasProps {
    diagram: UseCaseDiagram;
    fileDir?: string;
}

const UseCaseDiagramCanvasInner = ({ fileDir }: { fileDir?: string }) => {
    const canvas = useRef<HTMLDivElement>(null);
    const [menu, setMenu] = useState<{ 
        id: string; 
        top: number; 
        left: number; 
        edge?: { id: string; type: string; sourceType: string; targetType: string; } 
    } | null>(null);
    const [arrangeMenu, setArrangeMenu] = useState<{ top: number; left: number } | null>(null);
    const [selectedRelationshipType, setSelectedRelationshipType] = useState<'association' | 'includes' | 'extends' | 'generalizes'>('association');
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect: originalOnConnect,
        deleteEdge,
        addActorNode,
        addUseCaseNode,
        saveDiagram,
        setNodes,
        createConnection,
        updateRelationship,
    } = useUseCaseDiagramContext();

    const handleRelationshipTypeChange = (event: SelectChangeEvent<string>) => {
        setSelectedRelationshipType(event.target.value as 'association' | 'includes' | 'extends' | 'generalizes');
    };

    const onConnect = useCallback((params: Connection) => {
        if (createConnection) {
            createConnection(params, selectedRelationshipType);
        } else {
            originalOnConnect(params);
        }
    }, [createConnection, originalOnConnect, selectedRelationshipType]);

    const onEdgeContextMenu: EdgeMouseHandler = useCallback((event, edge) => {
        event.preventDefault();
        const reactFlowBounds = canvas.current?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        const top = event.clientY - reactFlowBounds.top;
        const left = event.clientX - reactFlowBounds.left;
        
        // Find source and target nodes to determine connection type
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        setMenu({
            id: edge.id,
            top,
            left,
            edge: {
                id: edge.id,
                type: (edge.data as any)?.relationship?.type || 'association',
                sourceType: sourceNode?.type || 'unknown',
                targetType: targetNode?.type || 'unknown',
            }
        });
    }, [nodes]);

    const onPaneClick = useCallback(() => {
        setMenu(null);
        setArrangeMenu(null);
    }, []);

    const handleDeleteEdge = useCallback((edgeId: string) => {
        deleteEdge(edgeId);
        setMenu(null);
    }, [deleteEdge]);

    const handleChangeRelationshipType = useCallback((edgeId: string, newType: 'association' | 'includes' | 'extends' | 'generalizes') => {
        updateRelationship(edgeId, { type: newType });
        setMenu(null);
    }, [updateRelationship]);

    const handleSave = useCallback(() => {
        if (fileDir) {
            saveDiagram(fileDir)
                .catch(err => {
                    console.error('Error saving diagram or geometry from canvas:', err);
                });
        } else {
            console.warn('Save clicked, but no fileDir is specified. Diagram not saved.');
        }
    }, [fileDir, saveDiagram]);

    const handleArrangeClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setArrangeMenu({
            top: buttonRect.bottom,
            left: buttonRect.left,
        });
    }, []);

    const handleArrange = useCallback((layoutType: string, options: LayoutOptions = {}) => {
        let arrangedNodes;
        switch (layoutType) {
            case 'usecase':
                // Special use case diagram layout
                arrangedNodes = nodes.map((node, index) => {
                    if (node.type === 'actor') {
                        // Place actors on the left side
                        const actorIndex = nodes.filter(n => n.type === 'actor').indexOf(node);
                        return {
                            ...node,
                            position: { x: 100, y: 150 + actorIndex * 200 }
                        };
                    } else if (node.type === 'useCase') {
                        // Place use cases in the center/right
                        const useCaseIndex = nodes.filter(n => n.type === 'useCase').indexOf(node);
                        const col = useCaseIndex % 2;
                        const row = Math.floor(useCaseIndex / 2);
                        return {
                            ...node,
                            position: { x: 500 + col * 300, y: 150 + row * 150 }
                        };
                    }
                    return node;
                });
                break;
            case 'auto':
                arrangedNodes = autoArrange(nodes as any, edges as any, options);
                break;
            case 'force':
                arrangedNodes = forceDirectedLayout(nodes as any, edges as any, options);
                break;
            case 'grid':
                arrangedNodes = gridLayout(nodes as any, options);
                break;
            case 'circle':
                arrangedNodes = circleLayout(nodes as any, options);
                break;
            default:
                arrangedNodes = autoArrange(nodes as any, edges as any, options);
        }

        setNodes(arrangedNodes as any);
        setArrangeMenu(null);
    }, [nodes, edges, setNodes]);

    return (
        <>
            <ReactFlow
                ref={canvas}
                style={{ backgroundColor: '#fefefe', width: '100%', height: '100%' }}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                connectionMode={ConnectionMode.Loose}
                onEdgeContextMenu={onEdgeContextMenu}
                fitView
                fitViewOptions={fitViewOptions}
                defaultEdgeOptions={defaultEdgeOptions}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                snapToGrid={true}
                snapGrid={[15, 15]}
                connectOnClick={false}
                deleteKeyCode={['Backspace', 'Delete']}
            >
                <Background color="#e5e7eb" variant={BackgroundVariant.Dots} size={1} />
                <Controls>
                    <FormControl size="small" sx={{ mb: 1, minWidth: 160 }}>
                        <InputLabel>Relationship</InputLabel>
                        <Select
                            value={selectedRelationshipType}
                            onChange={handleRelationshipTypeChange}
                            label="Relationship"
                            sx={{ 
                                bgcolor: 'white', 
                                fontSize: '12px',
                                '& .MuiSelect-select': {
                                    color: selectedRelationshipType === 'association' ? '#2563eb' : 
                                           selectedRelationshipType === 'includes' ? '#dc2626' :
                                           selectedRelationshipType === 'extends' ? '#7c3aed' : '#16a34a',
                                    fontWeight: 'bold'
                                }
                            }}
                        >
                            <MenuItem value="association">Association (Actor↔UseCase)</MenuItem>
                            <MenuItem value="includes">«includes» (UseCase→UseCase)</MenuItem>
                            <MenuItem value="extends">«extends» (UseCase→UseCase)</MenuItem>
                            <MenuItem value="generalizes">Generalizes (UseCase→UseCase)</MenuItem>
                        </Select>
                    </FormControl>
                    <br />
                    <div style={{ 
                        backgroundColor: selectedRelationshipType === 'association' ? '#dbeafe' : 
                                       selectedRelationshipType === 'includes' ? '#fef2f2' :
                                       selectedRelationshipType === 'extends' ? '#faf5ff' : '#f0fdf4',
                        padding: '8px', 
                        borderRadius: '4px', 
                        fontSize: '10px', 
                        marginBottom: '8px',
                        maxWidth: '160px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <strong>UML Rules:</strong><br />
                        • Actor ↔ Use Case: Association only<br />
                        • Use Case → Use Case: Include/Extend/Generalize<br />
                        • Actor → Actor: Not allowed<br />
                        <br />
                        <strong>How to connect:</strong><br />
                        1. Select relationship type above<br />
                        2. Drag from source handle to target handle<br />
                        3. Connection will auto-validate<br />
                        <div style={{ 
                            marginTop: '4px', 
                            padding: '4px', 
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            borderRadius: '2px',
                            fontWeight: 'bold'
                        }}>
                            Current: {selectedRelationshipType.toUpperCase()}
                        </div>
                    </div>
                    <Button variant="contained" onClick={addActorNode} sx={{ mb: 1, bgcolor: '#2563eb' }}>
                        Add Actor
                    </Button>
                    <br />
                    <Button variant="contained" onClick={addUseCaseNode} sx={{ mb: 1, bgcolor: '#16a34a' }}>
                        Add Use Case
                    </Button>
                    <br />
                    <Button variant="contained" onClick={handleArrangeClick} sx={{ mb: 1, bgcolor: '#7c3aed' }}>
                        Arrange
                    </Button>
                    <br />
                    <Button variant="contained" onClick={handleSave} disabled={!fileDir} sx={{ bgcolor: '#dc2626' }}>
                        Save
                    </Button>
                </Controls>
                {menu && (
                    <div
                        style={{
                            position: 'absolute',
                            zIndex: 1000,
                            backgroundColor: 'white',
                            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            top: menu.top,
                            left: menu.left,
                            padding: '8px',
                            minWidth: '200px'
                        }}
                    >
                        {menu.edge && menu.edge.sourceType === 'useCase' && menu.edge.targetType === 'useCase' && (
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Relationship Type:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <Button
                                        variant={menu.edge.type === 'includes' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => handleChangeRelationshipType(menu.id, 'includes')}
                                        sx={{ fontSize: '11px' }}
                                    >
                                        &laquo;includes&raquo;
                                    </Button>
                                    <Button
                                        variant={menu.edge.type === 'extends' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => handleChangeRelationshipType(menu.id, 'extends')}
                                        sx={{ fontSize: '11px' }}
                                    >
                                        &laquo;extends&raquo;
                                    </Button>
                                    <Button
                                        variant={menu.edge.type === 'generalizes' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => handleChangeRelationshipType(menu.id, 'generalizes')}
                                        sx={{ fontSize: '11px' }}
                                    >
                                        Generalizes
                                    </Button>
                                </div>
                            </div>
                        )}
                        {menu.edge && (menu.edge.sourceType === 'actor' || menu.edge.targetType === 'actor') && (
                            <div style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
                                Actor-UseCase relationship (Association)
                            </div>
                        )}
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteEdge(menu.id)}
                            fullWidth
                        >
                            Delete Connection
                        </Button>
                    </div>
                )}
                {arrangeMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            zIndex: 1000,
                            backgroundColor: 'white',
                            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            top: arrangeMenu.top,
                            left: arrangeMenu.left
                        }}
                    >
                        <Menu
                            open={Boolean(arrangeMenu)}
                            anchorReference="anchorPosition"
                            anchorPosition={arrangeMenu && {
                                top: arrangeMenu.top,
                                left: arrangeMenu.left
                            }}
                            onClose={() => setArrangeMenu(null)}
                        >
                            <MenuItem onClick={() => handleArrange('usecase')}>Use Case Layout</MenuItem>
                            <MenuItem onClick={() => handleArrange('auto')}>Auto Arrange</MenuItem>
                            <MenuItem onClick={() => handleArrange('grid')}>Grid Layout</MenuItem>
                            <MenuItem onClick={() => handleArrange('circle', { centerX: 500, centerY: 300 })}>Circle Layout</MenuItem>
                            <MenuItem onClick={() => handleArrange('force')}>Force Directed Layout</MenuItem>
                        </Menu>
                    </div>
                )}
            </ReactFlow>
        </>
    );
};

const UseCaseDiagramCanvas: React.FC<UseCaseDiagramCanvasProps> = ({ diagram, fileDir }) => {
    const providerKey = fileDir || diagram.diagramName || 'new-diagram';
    return (
        <UseCaseDiagramProvider key={providerKey} initialDiagram={diagram} fileDir={fileDir}>
            <UseCaseDiagramCanvasInner fileDir={fileDir} />
        </UseCaseDiagramProvider>
    );
};

export default UseCaseDiagramCanvas;
