'use client';
import { createContext,useContext } from 'react';
export type WorkspaceIdentity={id:string;email:string}|null;
export const WorkspaceContext=createContext<{user:WorkspaceIdentity;demo:boolean}>({user:null,demo:true});
export const useWorkspace=()=>useContext(WorkspaceContext);
