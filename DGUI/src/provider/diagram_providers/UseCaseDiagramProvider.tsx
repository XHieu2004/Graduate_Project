import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import {
    Node, Edge, OnNodesChange, OnEdgesChange, OnConnect,
    applyNodeChanges, applyEdgeChanges, addEdge, Connection
} from '@xyflow/react';
import { Actor, UseCase, UseCaseRelationship, UseCaseDiagram } from '../../models/UsecaseDiagram';

interface NodeGeometry {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
}

interface UseCaseDiagramContextType {
    nodes: Node<{ actor?: Actor, useCase?: UseCase, id: string }>[];
    edges: Edge<{ relationship: UseCaseRelationship }>[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    createConnection: (params: Connection, relationshipType: 'association' | 'includes' | 'extends' | 'generalizes') => void;
    updateActor: (nodeId: string, actorData: Actor) => void;
    updateUseCase: (nodeId: string, useCaseData: UseCase) => void;
    updateRelationship: (edgeId: string, relationship: Partial<UseCaseRelationship>) => void;
    deleteEdge: (edgeId: string) => void;
    addActorNode: () => void;
    addUseCaseNode: () => void;
    deleteActorNode: (nodeId: string) => void;
    deleteUseCaseNode: (nodeId: string) => void;
    saveDiagram: (fileDir: string) => Promise<void>;
    getDiagramData: () => UseCaseDiagram;
    setNodes: (nodes: Node<{ actor?: Actor, useCase?: UseCase, id: string }>[]) => void;
    initialGeometryLoaded: boolean;
}

const UseCaseDiagramContext = createContext<UseCaseDiagramContextType | undefined>(undefined);

const diagramStateCache = new Map<string, {
    nodes: Node<{ actor?: Actor, useCase?: UseCase, id: string }>[],
    edges: Edge<{ relationship: UseCaseRelationship }>[]
}>();

export function useUseCaseDiagramContext() {
    const context = useContext(UseCaseDiagramContext);
    if (!context) {
        throw new Error('useUseCaseDiagramContext must be used within a UseCaseDiagramProvider');
    }
    return context;
}

interface UseCaseDiagramProviderProps {
    children: ReactNode;
    initialDiagram: UseCaseDiagram;
    fileDir?: string;
}

const getGeometryFilePath = (mainFilePath?: string): string => {
    if (!mainFilePath) return '';
    const normalizedPath = mainFilePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const fileName = parts.pop();
    if (!fileName) return '';

    const folderPath = parts.join('/');
    const geometryFilename = fileName.replace(/\.(json|diagram)$/i, '') + ".geometry.json";

    return folderPath ? `${folderPath}/${geometryFilename}` : geometryFilename;
};

function convertDiagramToNodesAndEdges(diagram: UseCaseDiagram): {
    nodes: Node<{ actor?: Actor, useCase?: UseCase, id: string }>[],
    edges: Edge<{ relationship: UseCaseRelationship }>[]
} {
    const nodes: Node<{ actor?: Actor, useCase?: UseCase, id: string }>[] = [];
    const edges: Edge<{ relationship: UseCaseRelationship }>[] = [];

    // Convert actors to nodes - position them on the left side
    diagram.actors.forEach((actor, index) => {
        const y = 100 + (index * 200); // Increase spacing between actors
        nodes.push({
            id: `actor-${index}`,
            type: 'actor',
            position: { x: 100, y }, // Move actors a bit more to the right
            data: { actor, id: `actor-${index}` }
        });
    });

    // Convert use cases to nodes - position them in the center/right
    diagram.useCases.forEach((useCase, index) => {
        const y = 120 + (index * 150); // Adjust spacing for use cases
        const x = 500 + (index % 2) * 300; // Create two columns for better layout
        nodes.push({
            id: `usecase-${index}`,
            type: 'useCase',
            position: { x, y },
            data: { useCase, id: `usecase-${index}` }
        });
    });

    // Convert relationships to edges
    diagram.relationships.forEach((relationship, index) => {
        const sourceNode = nodes.find(node => 
            (node.data.actor?.name === relationship.from) || 
            (node.data.useCase?.name === relationship.from)
        );
        const targetNode = nodes.find(node => 
            (node.data.actor?.name === relationship.to) || 
            (node.data.useCase?.name === relationship.to)
        );

        if (sourceNode && targetNode) {
            edges.push({
                id: `edge-${index}`,
                source: sourceNode.id,
                target: targetNode.id,
                type: 'default',
                data: { relationship },
                style: { stroke: '#374151', strokeWidth: 2 }
            });
        }
    });

    return { nodes, edges };
}

export function UseCaseDiagramProvider({ children, initialDiagram, fileDir }: UseCaseDiagramProviderProps) {
    const cacheKey = fileDir ? `diagram-${fileDir}` : `diagram-${initialDiagram.diagramName}-unsaved`;

    const { initialNodes: memoizedInitialNodes, initialEdges: memoizedInitialEdges } = useMemo(() => {
        if (fileDir && diagramStateCache.has(cacheKey)) {
            const cached = diagramStateCache.get(cacheKey)!;
            return {
                initialNodes: cached.nodes,
                initialEdges: cached.edges
            };
        }
        const { nodes: newNodes, edges: newEdges } = convertDiagramToNodesAndEdges(initialDiagram);
        if (fileDir) {
            diagramStateCache.set(cacheKey, { nodes: newNodes, edges: newEdges });
        }
        return {
            initialNodes: newNodes,
            initialEdges: newEdges
        };
    }, [initialDiagram, fileDir, cacheKey]);

    const [nodes, setNodes] = useState<Node<{ actor?: Actor, useCase?: UseCase, id: string }>[]>(memoizedInitialNodes);
    const [edges, setEdges] = useState<Edge<{ relationship: UseCaseRelationship }>[]>(memoizedInitialEdges);
    const [initialGeometryLoaded, setInitialGeometryLoaded] = useState(false);

    useEffect(() => {
        if (fileDir) {
            diagramStateCache.set(cacheKey, { nodes, edges });
        }
    }, [nodes, edges, cacheKey, fileDir]);

    useEffect(() => {
        if (!fileDir) {
            const { nodes: defaultNodes } = convertDiagramToNodesAndEdges(initialDiagram);
            setNodes(defaultNodes);
            setEdges(convertDiagramToNodesAndEdges(initialDiagram).edges);
            setInitialGeometryLoaded(true);
            return;
        }

        setInitialGeometryLoaded(false);

        const loadOrCreateGeometry = async () => {
            const geometryFilePath = getGeometryFilePath(fileDir);
            if (!geometryFilePath) {
                console.warn("Cannot load or create geometry: main fileDir is invalid for path generation.");
                setNodes(memoizedInitialNodes);
                setEdges(memoizedInitialEdges);
                setInitialGeometryLoaded(true);
                return;
            }

            let geometryApplied = false;
            try {
                const geometryJson = await window.myAPI.readFileAsText(geometryFilePath);
                const geometries: NodeGeometry[] = JSON.parse(geometryJson);

                if (geometries && Array.isArray(geometries) && geometries.length > 0) {
                    const { nodes: baseNodes, edges: baseEdges } = convertDiagramToNodesAndEdges(initialDiagram);
                    const updatedNodes = baseNodes.map(node => {
                        const geom = geometries.find(g => g.id === node.id);
                        if (geom) {
                            return {
                                ...node,
                                position: { x: geom.x, y: geom.y },
                                width: geom.width,
                                height: geom.height,
                                style: { ...node.style, width: geom.width, height: geom.height }
                            };
                        }
                        return node;
                    });
                    setNodes(updatedNodes as Node<{ actor?: Actor, useCase?: UseCase, id: string }>[]);
                    setEdges(baseEdges);
                    geometryApplied = true;
                } else {
                    console.warn(`No valid geometries found in ${geometryFilePath}. Will attempt to create.`);
                }
            } catch (error) {
                console.warn(`Geometry file ${geometryFilePath} not found or error loading:`, error, ". Will attempt to create.");
                setNodes(memoizedInitialNodes);
                setEdges(memoizedInitialEdges);
            }

            if (geometryApplied) {
                setInitialGeometryLoaded(true);
            } else {
                const nodesToSaveDefaultGeometry = nodes;

                if (nodesToSaveDefaultGeometry.length > 0) {
                    const nodeGeometries: NodeGeometry[] = nodesToSaveDefaultGeometry.map(node => ({
                        id: node.id,
                        x: node.position.x,
                        y: node.position.y,
                        width: node.width,
                        height: node.height,
                    }));

                    try {
                        const geometryJsonToSave = JSON.stringify(nodeGeometries, null, 2);
                        await window.myAPI.saveFile(geometryFilePath, geometryJsonToSave);
                        setInitialGeometryLoaded(true);
                    } catch (saveError) {
                        console.error(`Error creating initial geometry file ${geometryFilePath}:`, saveError);
                        setInitialGeometryLoaded(true);
                    }
                } else {
                    console.warn("No nodes to create initial geometry for.");
                    setInitialGeometryLoaded(true);
                }
            }
        };

        loadOrCreateGeometry();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileDir, initialDiagram, memoizedInitialNodes, memoizedInitialEdges]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<{ actor?: Actor, useCase?: UseCase, id: string }>[]),
        [setNodes]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds) as Edge<{ relationship: UseCaseRelationship }>[]),
        [setEdges]
    );

    const onConnect: OnConnect = useCallback(
        (params) => {
            setEdges((eds) => {
                const sourceNode = nodes.find(node => node.id === params.source);
                const targetNode = nodes.find(node => node.id === params.target);

                if (!sourceNode || !targetNode) return eds;

                // Validate connections based on UML rules:
                // 1. Actors can connect to Use Cases (association)
                // 2. Use Cases can connect to other Use Cases (includes, extends, generalizes)
                const isActorToUseCase = sourceNode.type === 'actor' && targetNode.type === 'useCase';
                const isUseCaseToActor = sourceNode.type === 'useCase' && targetNode.type === 'actor';
                const isUseCaseToUseCase = sourceNode.type === 'useCase' && targetNode.type === 'useCase';

                const isValidConnection = isActorToUseCase || isUseCaseToActor || isUseCaseToUseCase;

                if (!isValidConnection) {
                    console.log('Invalid connection: Only Actor-UseCase and UseCase-UseCase connections are allowed');
                    return eds;
                }

                const sourceName = sourceNode.data.actor?.name || sourceNode.data.useCase?.name || '';
                const targetName = targetNode.data.actor?.name || targetNode.data.useCase?.name || '';

                // Determine relationship type based on connection
                let relationshipType: 'association' | 'includes' | 'extends' | 'generalizes' = 'association';
                
                if (isUseCaseToUseCase) {
                    // For use case to use case connections, default to 'includes' 
                    // (can be changed later via relationship selector)
                    relationshipType = 'includes';
                } else {
                    // Actor to use case connections are always 'association'
                    relationshipType = 'association';
                }

                const relationship: UseCaseRelationship = {
                    type: relationshipType,
                    from: sourceName,
                    to: targetName,
                };

                return addEdge({
                    ...params,
                    type: 'default',
                    data: { relationship },
                    style: { stroke: '#374151', strokeWidth: 2 }
                }, eds) as Edge<{ relationship: UseCaseRelationship }>[];
            });
        },
        [nodes, setEdges]
    );

    const updateActor = useCallback((nodeId: string, actorData: Actor) => {
        setNodes(nds =>
            nds.map(node =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, actor: actorData } }
                    : node
            )
        );
    }, [setNodes]);

    const updateUseCase = useCallback((nodeId: string, useCaseData: UseCase) => {
        setNodes(nds =>
            nds.map(node =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, useCase: useCaseData } }
                    : node
            )
        );
    }, [setNodes]);

    const updateRelationship = useCallback((edgeId: string, relationshipUpdate: Partial<UseCaseRelationship>) => {
        setEdges(eds =>
            eds.map(edge => {
                if (edge.id === edgeId) {
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            relationship: { ...edge.data.relationship, ...relationshipUpdate }
                        }
                    };
                }
                return edge;
            })
        );
    }, [setEdges]);

    const deleteEdge = useCallback((edgeId: string) => {
        setEdges(eds => eds.filter(edge => edge.id !== edgeId));
    }, [setEdges]);

    const addActorNode = useCallback(() => {
        const newActor: Actor = {
            name: 'New Actor',
            description: 'Actor description'
        };

        // Calculate position for new actor (left side)
        const actorNodes = nodes.filter(node => node.type === 'actor');
        const yPosition = 150 + actorNodes.length * 200;

        const newNode: Node<{ actor?: Actor, useCase?: UseCase, id: string }> = {
            id: `actor-${Date.now()}`,
            type: 'actor',
            position: { x: 100, y: yPosition },
            data: { actor: newActor, id: `actor-${Date.now()}` }
        };

        setNodes(nds => [...nds, newNode]);
    }, [nodes, setNodes]);

    const addUseCaseNode = useCallback(() => {
        const newUseCase: UseCase = {
            name: 'New Use Case',
            description: 'Use case description'
        };

        // Calculate position for new use case (center/right side)
        const useCaseNodes = nodes.filter(node => node.type === 'useCase');
        const col = useCaseNodes.length % 2;
        const row = Math.floor(useCaseNodes.length / 2);
        const xPosition = 500 + col * 300;
        const yPosition = 150 + row * 150;

        const newNode: Node<{ actor?: Actor, useCase?: UseCase, id: string }> = {
            id: `usecase-${Date.now()}`,
            type: 'useCase',
            position: { x: xPosition, y: yPosition },
            data: { useCase: newUseCase, id: `usecase-${Date.now()}` }
        };

        setNodes(nds => [...nds, newNode]);
    }, [nodes, setNodes]);

    const deleteActorNode = useCallback((nodeId: string) => {
        setNodes(nds => nds.filter(node => node.id !== nodeId));
    }, [setNodes]);

    const deleteUseCaseNode = useCallback((nodeId: string) => {
        setNodes(nds => nds.filter(node => node.id !== nodeId));
    }, [setNodes]);

    const getDiagramData = useCallback((): UseCaseDiagram => {
        const actors: Actor[] = [];
        const useCases: UseCase[] = [];
        const relationships: UseCaseRelationship[] = [];

        nodes.forEach(node => {
            if (node.data.actor) {
                actors.push(node.data.actor);
            }
            if (node.data.useCase) {
                useCases.push(node.data.useCase);
            }
        });

        edges.forEach(edge => {
            relationships.push(edge.data.relationship);
        });

        return new UseCaseDiagram(initialDiagram.diagramName, actors, useCases, relationships);
    }, [nodes, edges, initialDiagram.diagramName]);

    const saveDiagram = useCallback(async (fileDir: string) => {
        const diagramData = getDiagramData();
        const diagramJson = JSON.stringify(diagramData, null, 2);

        try {
            await window.myAPI.saveFile(fileDir, diagramJson);

            const geometryFilePath = getGeometryFilePath(fileDir);
            if (geometryFilePath) {
                const nodeGeometries: NodeGeometry[] = nodes.map(node => ({
                    id: node.id,
                    x: node.position.x,
                    y: node.position.y,
                    width: node.width,
                    height: node.height,
                }));

                const geometryJson = JSON.stringify(nodeGeometries, null, 2);
                await window.myAPI.saveFile(geometryFilePath, geometryJson);
            }
        } catch (error) {
            console.error('Error saving use case diagram:', error);
            throw error;
        }
    }, [getDiagramData, nodes]);

    const createConnection = useCallback((params: Connection, relationshipType: 'association' | 'includes' | 'extends' | 'generalizes') => {
        const sourceNode = nodes.find(node => node.id === params.source);
        const targetNode = nodes.find(node => node.id === params.target);

        if (!sourceNode || !targetNode) {
            console.warn('Cannot create connection: source or target node not found');
            return;
        }

        // UML Use Case Diagram Rules:
        // 1. Actor → Use Case: association only
        // 2. Use Case → Actor: association only (reverse direction)
        // 3. Use Case → Use Case: includes, extends, generalizes only
        // 4. Actor → Actor: NOT allowed
        
        const isActorToUseCase = sourceNode.type === 'actor' && targetNode.type === 'useCase';
        const isUseCaseToActor = sourceNode.type === 'useCase' && targetNode.type === 'actor';
        const isUseCaseToUseCase = sourceNode.type === 'useCase' && targetNode.type === 'useCase';
        const isActorToActor = sourceNode.type === 'actor' && targetNode.type === 'actor';

        // Block actor-to-actor connections
        if (isActorToActor) {
            console.warn('Invalid connection: Actor-to-Actor connections are not allowed in UML Use Case Diagrams');
            return;
        }

        const isValidConnection = isActorToUseCase || isUseCaseToActor || isUseCaseToUseCase;

        if (!isValidConnection) {
            console.warn('Invalid connection: Only Actor-UseCase and UseCase-UseCase connections are allowed');
            return;
        }

        // Validate relationship type based on connection type
        if ((isActorToUseCase || isUseCaseToActor) && relationshipType !== 'association') {
            console.warn('Actor-UseCase connections must be association type');
            relationshipType = 'association';
        }

        if (isUseCaseToUseCase && relationshipType === 'association') {
            console.warn('UseCase-UseCase connections must use "includes", "extends", or "generalizes" type');
            return;
        }

        const sourceName = sourceNode.data.actor?.name || sourceNode.data.useCase?.name || '';
        const targetName = targetNode.data.actor?.name || targetNode.data.useCase?.name || '';

        const newEdge: Edge<{ relationship: UseCaseRelationship }> = {
            id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: params.source || '',
            target: params.target || '',
            sourceHandle: params.sourceHandle || null,
            targetHandle: params.targetHandle || null,
            type: 'default',
            data: { 
                relationship: {
                    type: relationshipType,
                    from: sourceName,
                    to: targetName
                }
            },
            style: { stroke: '#374151', strokeWidth: 2 }
        };
        
        setEdges((eds) => addEdge(newEdge, eds));
    }, [nodes, setEdges]);

    const contextValue: UseCaseDiagramContextType = {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        createConnection,
        updateActor,
        updateUseCase,
        updateRelationship,
        deleteEdge,
        addActorNode,
        addUseCaseNode,
        deleteActorNode,
        deleteUseCaseNode,
        saveDiagram,
        getDiagramData,
        setNodes,
        initialGeometryLoaded
    };

    return (
        <UseCaseDiagramContext.Provider value={contextValue}>
            {children}
        </UseCaseDiagramContext.Provider>
    );
}
