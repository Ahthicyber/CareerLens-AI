'use client';
import Link from 'next/link';
import { ScanLine, SunMoon, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
export function Logo(){return <Link href="/" className="logo"><span className="logo-mark"><ScanLine size={23}/></span>CareerLens<span className="logo-ai">AI</span></Link>;}
export function ThemeToggle(){const [dark,setDark]=useState(false);useEffect(()=>{const value=localStorage.getItem('careerlens-theme')==='dark';document.documentElement.classList.toggle('dark',value);},[]);return <button className="icon-button" aria-label="Toggle light and dark theme" onClick={()=>{const value=!document.documentElement.classList.contains('dark');setDark(value);document.documentElement.classList.toggle('dark',value);localStorage.setItem('careerlens-theme',value?'dark':'light');}}><SunMoon size={19}/><span className="sr-only">{dark?'Light mode':'Dark mode'}</span></button>;}
export function Score({value,label='Overall score'}:{value:number;label?:string}){return <div className="score-wrap"><div className="score" style={{background:`conic-gradient(var(--accent) ${value}%, var(--line) 0)`}}><div><strong>{value}</strong><span>/ 100</span></div></div><span className="muted">{label}</span></div>;}
export function TextLink({href,children}:{href:string;children:React.ReactNode}){return <Link className="text-link" href={href}>{children}<ArrowUpRight size={16}/></Link>;}
