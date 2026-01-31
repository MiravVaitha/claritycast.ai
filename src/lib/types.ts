import {
    ClarifyOutput,
    CommunicateOutput,
    ClarityMode
} from "./schemas";

export type {
    ClarifyOutput,
    CommunicateOutput,
    ClarityMode
};

export interface ClarityCard {
    id: string | number;
    title: string;
    content: string;
}

export interface DraftCard {
    id: string | number;
    audience: string;
    intent: string;
    content: string;
}
