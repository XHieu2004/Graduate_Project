import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ClassDiagram } from '../models/ClassDiagram';
import { DatabaseDiagram } from '../models/DatabaseDiagram';
import UseCaseDiagram from '../models/UsecaseDiagram';
import ClassDiagramCanvas from '../components/DiagramComponents/ClassDiagramCanvas';
import DatabaseDiagramCanvas from '../components/DiagramComponents/DatabaseDiagramCanvas';
import UseCaseDiagramCanvas from '../components/DiagramComponents/UseCaseDiagramCanvas';
import { ReactFlowProvider } from '@xyflow/react';

interface DiagramViewProps {
    fileDir: string;
    setLoading?: (loading: boolean) => void;
}

const DiagramView: React.FC<DiagramViewProps> = ({ fileDir, setLoading }) => {
    const [diagram, setDiagram] = useState<any>(null);

    const loadDiagram = useCallback(() => {
        if (setLoading) {
            setLoading(true);
        }        window.myAPI.readFileAsText(fileDir).then((data: string) => {
            const jsonData = JSON.parse(data);
            if (jsonData.diagramType === "UML Class Diagram") {
                const classDiagram = ClassDiagram.fromJSON(jsonData);
                setDiagram(<div className="pt-4 w-full h-full"><ReactFlowProvider><ClassDiagramCanvas diagram={classDiagram} fileDir={fileDir}></ClassDiagramCanvas></ReactFlowProvider></div>);
            } else if (jsonData.diagramType === "ER Diagram") {
                const databaseDiagram = DatabaseDiagram.fromJSON(jsonData);
                setDiagram(<div className="pt-4 w-full h-full"><ReactFlowProvider><DatabaseDiagramCanvas diagram={databaseDiagram} fileDir={fileDir}></DatabaseDiagramCanvas></ReactFlowProvider></div>);
            } else if (jsonData.diagramType === "Use Case Diagram") {
                const useCaseDiagram = new UseCaseDiagram(
                    jsonData.diagramName,
                    jsonData.actors || [],
                    jsonData.useCases || [],
                    jsonData.relationships || []
                );
                setDiagram(<div className="pt-4 w-full h-full"><ReactFlowProvider><UseCaseDiagramCanvas diagram={useCaseDiagram} fileDir={fileDir}></UseCaseDiagramCanvas></ReactFlowProvider></div>);
            }
            // handle other diagram types here

            if (setLoading) {
                setLoading(false);
            }
        }).catch((error) => {
            console.error("Error loading diagram:", error);
            if (setLoading) {
                setLoading(false);
            }
        });
    }, [fileDir, setLoading]);

    useEffect(() => {
        loadDiagram();

        window.myAPI.watchFile(fileDir);
        const removeFileChangeListener = window.myAPI.onFileChange((changedFilePath: string) => {
            if (changedFilePath === fileDir) {
                loadDiagram();
            }
        });

        return () => {
            window.myAPI.unwatchFile(fileDir);
            if (removeFileChangeListener) {
                removeFileChangeListener();
            }
        };
    }, [fileDir, loadDiagram]);

    return <div className='w-full h-full'>
        {diagram}
    </div>
};

export default DiagramView;