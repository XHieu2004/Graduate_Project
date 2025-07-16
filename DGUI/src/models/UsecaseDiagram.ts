import IDiagram from "./IDiagram";

export type Actor = {
    name: string;
    description: string;
}

export type UseCase = {
    name: string;
    description: string;
}

export type UseCaseRelationship = {
    type: 'association' | 'includes' | 'extends' | 'generalizes';
    from: string;
    to: string;
    description?: string;
}

export class UseCaseDiagram implements IDiagram {
    diagramType = 'Use Case Diagram';
    diagramName: string;
    actors: Actor[];
    useCases: UseCase[];
    relationships: UseCaseRelationship[];

    constructor(diagramName: string, actors: Actor[] = [], useCases: UseCase[] = [], relationships: UseCaseRelationship[] = []) {
        this.diagramName = diagramName;
        this.actors = actors;
        this.useCases = useCases;
        this.relationships = relationships;
    }
}

export default UseCaseDiagram;