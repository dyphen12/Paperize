import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Story, Compiler } from 'inkjs/full';

import { DialogueNode } from './components/DialogueNode';
import { ChoiceNode } from './components/ChoiceNode';
import { InkEditor } from './components/InkEditor';
import { compileGraphToInk } from './utils/inkCompiler';
import { themes, applyTheme, loadSavedTheme } from './themes';
import type { Theme } from './themes';

const nodeTypes = {
  dialogue: DialogueNode,
  choice: ChoiceNode,
};

const initialNodes: Node[] = [
  {
    id: 'node-start',
    type: 'dialogue',
    position: { x: 250, y: 150 },
    data: { label: 'Start Knot', text: 'Once upon a time in a dark forest...' },
  },
];

const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [playMode, setPlayMode] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Story');
  const [story, setStory] = useState<Story | null>(null);
  const [currentText, setCurrentText] = useState<string[]>([]);
  const [currentChoices, setCurrentChoices] = useState<any[]>([]);
  const [compilerErrors, setCompilerErrors] = useState<string[]>([]);
  
  // Phase 6 Integrations
  const [externalFunctions, setExternalFunctions] = useState<string[]>(['MakeFace(expression)', 'EmitReaction(type)', 'IncreaseHunger(amount)', 'ChangeClothing(item)']);
  const [showIntegrations, setShowIntegrations] = useState(false);

  // Theme engine
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = loadSavedTheme();
    applyTheme(saved);
    return saved;
  });

  const cycleTheme = () => {
    const idx = themes.findIndex((t) => t.name === currentTheme.name);
    const next = themes[(idx + 1) % themes.length];
    applyTheme(next);
    setCurrentTheme(next);
  };
  
  // Autocomplete state
  const [cursorIndex, setCursorIndex] = useState(0);
  const [intellisenseOptions, setIntellisenseOptions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // IntelliSense Logic
  useEffect(() => {
    if (selectedNode && typeof selectedNode.data.text === 'string') {
      const textUpToCursor = selectedNode.data.text.substring(0, cursorIndex);
      const currentLine = textUpToCursor.split('\n').pop() || '';
      
      if (currentLine.trimStart().startsWith('~')) {
        const parts = currentLine.trimStart().split('~');
        if (parts.length > 1) {
          const searchStr = parts[1].trim().toLowerCase();
          const matches = externalFunctions.filter(f => f.toLowerCase().includes(searchStr));
          setIntellisenseOptions(matches);
          return;
        }
      }
    }
    setIntellisenseOptions([]);
  }, [cursorIndex, selectedNode, externalFunctions]);

  const insertFunction = (funcStr: string) => {
    if (!selectedNodeId || !textareaRef.current || !selectedNode) return;
    const text = selectedNode.data.text as string;
    const textUpToCursor = text.substring(0, cursorIndex);
    const textAfterCursor = text.substring(cursorIndex);
    
    // Find where the `~` started on this line to replace only the typed fragment
    const lastNewlineIdx = textUpToCursor.lastIndexOf('\n');
    const startOfLine = lastNewlineIdx === -1 ? 0 : lastNewlineIdx + 1;
    const lineUpToCursor = textUpToCursor.substring(startOfLine);
    const tildeIdx = lineUpToCursor.indexOf('~');
    
    if (tildeIdx !== -1) {
      const globalTildeIdx = startOfLine + tildeIdx;
      const newText = text.substring(0, globalTildeIdx) + `~ ${funcStr}` + textAfterCursor;
      updateNodeText(newText);
      // set cursor back into the parens if possible, but standard behavior is just to replace
    }
    setIntellisenseOptions([]);
    textareaRef.current.focus();
  };

  const updateNodeText = (text: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, data: { ...n.data, text } };
        }
        return n;
      }),
    );
  };

  const updateNodeLabel = (label: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, data: { ...n.data, label } };
        }
        return n;
      }),
    );
  };

  const updateChoiceModifiers = (isSticky?: boolean, isFallback?: boolean) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              isSticky: isSticky !== undefined ? isSticky : n.data.isSticky,
              isFallback: isFallback !== undefined ? isFallback : n.data.isFallback,
            },
          };
        }
        return n;
      }),
    );
  };

  const addDialogueNode = () => {
    const newNode: Node = {
      id: `node-${uuidv4()}`,
      type: 'dialogue',
      position: { x: (Math.random() * 200) + 300, y: (Math.random() * 200) + 150 },
      data: { label: 'New Knot', text: '' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addChoiceNode = () => {
    const newNode: Node = {
      id: `choice-${uuidv4()}`,
      type: 'choice',
      position: { x: (Math.random() * 200) + 300, y: (Math.random() * 200) + 250 },
      data: { label: 'Choice', text: '' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // -----------------------------------------
  // PLAY MODE & COMPILATION
  // -----------------------------------------
  const startPlayMode = () => {
    setPlayMode(true);
    setCompilerErrors([]);
    try {
      const inkSource = compileGraphToInk(nodes, edges, externalFunctions);
      console.log("Compiled Ink:\n", inkSource);
      
      const compiler = new Compiler(inkSource);
      const storyObj = compiler.Compile();
      
      // Handle Ink errors
      if (compiler.errors && compiler.errors.length > 0) {
        setCompilerErrors(compiler.errors);
        return;
      }
      
      // Bind dummy functions so the web player doesn't crash!
      for (const funcStr of externalFunctions) {
        const funcName = funcStr.split('(')[0].trim();
        storyObj.BindExternalFunction(funcName, (...args: any[]) => {
           console.log(`[Unity Function Invoked]: ${funcName}`, args);
        });
      }
      
      setStory(storyObj);
      continueStory(storyObj);
    } catch (e: any) {
      console.error(e);
      setCompilerErrors([e.message || "Unknown error occurred during compilation"]);
      setStory(null);
    }
  };

  const continueStory = (s: Story) => {
    const textBlocks: string[] = [];
    while (s.canContinue) {
      const text = s.Continue();
      if (text) textBlocks.push(text.trim());
    }
    setCurrentText(textBlocks);
    setCurrentChoices(s.currentChoices);
  };

  const makeChoice = (choiceIndex: number) => {
    if (story) {
      story.ChooseChoiceIndex(choiceIndex);
      continueStory(story);
    }
  };

  // -----------------------------------------
  // EXPORT / IMPORT
  // -----------------------------------------
  const downloadFile = async (content: string, filename: string, mimeType: string, extension: string) => {
    try {
      if ('showSaveFilePicker' in window) {
        const cleanedMimeType = mimeType.split(';')[0];
        const options = {
          suggestedName: filename,
          types: [{
            description: `${extension.toUpperCase()} File`,
            accept: { [cleanedMimeType]: [extension] },
          }],
        };
        const handle = await (window as any).showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("File System API failed, falling back to legacy download:", err);
    }
    
    // Legacy fallback
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const exportToInk = () => {
    const inkSource = compileGraphToInk(nodes, edges, externalFunctions);
    downloadFile(inkSource, `${projectTitle}.ink`, 'text/plain;charset=utf-8', '.ink');
  };

  const saveProject = () => {
    const projectData = JSON.stringify({ nodes, edges, projectTitle, externalFunctions }, null, 2);
    downloadFile(projectData, `${projectTitle}.prz`, 'application/json', '.prz');
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          if (data.projectTitle) {
            setProjectTitle(data.projectTitle);
          } else {
            setProjectTitle(fileName);
          }
          if (data.externalFunctions) {
            setExternalFunctions(data.externalFunctions);
          }
          setSelectedNodeId(null);
        }
      } catch (err) {
        console.error("Failed to parse project file", err);
        alert("Corrupted or invalid .prz file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="app-container">
      {/* Integrations Manager Modal */}
      {showIntegrations && (
        <div className="play-overlay">
          <div className="play-window" style={{ width: '500px', height: '600px', backgroundColor: 'var(--bg-texture)' }}>
            <div className="inspector-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2>Unity Integrations</h2>
              <button className="close-btn" onClick={() => setShowIntegrations(false)}>Done</button>
            </div>
            <div className="inspector-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Declare your global Unity C# functions here. They will autocomplete when writing and securely inject into your exports.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {externalFunctions.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={f}
                      onChange={(e) => {
                        const newFuncs = [...externalFunctions];
                        newFuncs[i] = e.target.value;
                        setExternalFunctions(newFuncs);
                      }}
                      style={{ flex: 1, padding: '8px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    />
                    <button 
                      onClick={() => setExternalFunctions(externalFunctions.filter((_, idx) => idx !== i))}
                      style={{ background: 'transparent', color: '#ff6b6b', border: 'none', cursor: 'pointer' }}
                    >X</button>
                  </div>
                ))}
              </div>
              <button 
                className="action-btn" 
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => setExternalFunctions([...externalFunctions, `NewFunction()`])}
              >
                + Add Function
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play Mode Overlay */}
      {playMode && (
        <div className="play-overlay">
          <div className="play-window">
             <button className="close-btn" onClick={() => setPlayMode(false)}>Close Player</button>
             
             {compilerErrors.length > 0 ? (
               <div className="play-content error-panel">
                 <h3 style={{ color: '#ff6b6b', marginBottom: '1rem', fontFamily: 'var(--font-sans)' }}>Ink Compiler Errors:</h3>
                 {compilerErrors.map((err, i) => (
                   <div key={i} className="error-item">{err}</div>
                 ))}
                 <p style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>Check your nodes for syntax issues (e.g. unclosed brackets).</p>
               </div>
             ) : (
               <div className="play-content">
                 {currentText.map((t, i) => (
                   <p key={i} className="book-text play-text">{t}</p>
                 ))}
                 <div className="play-choices">
                   {currentChoices.map((choice, i) => (
                     <button key={i} className="play-choice-btn" onClick={() => makeChoice(choice.index)}>
                       {choice.text}
                     </button>
                   ))}
                 </div>
                 {currentChoices.length === 0 && <p className="book-text" style={{marginTop: '2rem', fontStyle: 'italic', color: 'var(--text-secondary)'}}>-- End of Story --</p>}
               </div>
             )}
          </div>
        </div>
      )}

      <div className="graph-area">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
        >
          <Background color="var(--border-color)" gap={20} size={1} />
          <Controls />
        </ReactFlow>

        {/* Floating actions: Left side */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <input 
            type="text" 
            className="project-title-input" 
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Untitled Story"
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addDialogueNode} className="action-btn">+ Add Knot</button>
            <button onClick={addChoiceNode} className="action-btn">+ Add Choice</button>
          </div>
        </div>
        
        {/* Floating actions: Right side Toolbar */}
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowIntegrations(true)} className="action-btn">Integrations Config</button>
          <button onClick={() => fileInputRef.current?.click()} className="action-btn load-btn">Load Project</button>
          <input 
            type="file" 
            accept=".prz,.json" 
            style={{display: 'none'}} 
            ref={fileInputRef}
            onChange={handleLoadProject} 
          />
          <button onClick={saveProject} className="action-btn">Save Project</button>
          <button onClick={exportToInk} className="action-btn export-btn">Export .ink</button>
          <button onClick={cycleTheme} className="action-btn theme-btn" title="Switch Theme">{currentTheme.label}</button>
          <button onClick={startPlayMode} className="action-btn play-btn">▶ Play Story</button>
        </div>
      </div>

      {selectedNode && (
        <div className="inspector-panel" style={{ position: 'relative' }}>
          <div className="inspector-header">
             {selectedNode.type === 'dialogue' ? (
                <input 
                  type="text" 
                  value={(selectedNode.data.label as string) || ''} 
                  onChange={(e) => updateNodeLabel(e.target.value)}
                  className="knot-title-input"
                  placeholder="Knot Name"
                />
             ) : (
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                    <input 
                      type="text" 
                      value={(selectedNode.data.label as string) === 'Choice' ? '' : (selectedNode.data.label as string) || ''} 
                      onChange={(e) => updateNodeLabel(e.target.value)}
                      className="knot-title-input"
                      placeholder="Choice Prompt (e.g. What are you looking for?)"
                      style={{ fontSize: '1.2rem' }}
                    />
                  </div>
                  <div style={{display: 'flex', gap: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                      <input 
                        type="checkbox" 
                        checked={!!selectedNode.data.isSticky} 
                        onChange={(e) => updateChoiceModifiers(e.target.checked, undefined)} 
                      /> Sticky (+)
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                      <input 
                        type="checkbox" 
                        checked={!!selectedNode.data.isFallback} 
                        onChange={(e) => updateChoiceModifiers(undefined, e.target.checked)} 
                      /> Auto-Fallback (-&gt;)
                    </label>
                  </div>
                </div>
             )}
          </div>
          
          {/* Autocomplete Popup */}
          {intellisenseOptions.length > 0 && (
            <div className="autocomplete-popup" style={{
                position: 'absolute',
                top: '70px',
                left: '20px',
                right: '20px',
                background: 'var(--bg-color)',
                border: '1px solid var(--accent-color)',
                borderRadius: '4px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                maxHeight: '200px',
                overflowY: 'auto'
            }}>
               {intellisenseOptions.map((opt, i) => (
                 <div 
                   key={i} 
                   className="autocomplete-option"
                   style={{ padding: '10px', cursor: 'pointer', fontFamily: 'monospace', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}
                   onClick={() => insertFunction(opt)}
                 >
                   ~ {opt}
                 </div>
               ))}
            </div>
          )}

          <div className="inspector-body">
            <InkEditor
              textareaRef={textareaRef}
              value={selectedNode.data.text as string}
              disabled={!!selectedNode.data.isFallback}
              placeholder={selectedNode.type === 'choice' ? "Response dialogue (e.g. # speaker: Elara\nIrrelevant.)" : "Write your story here..."}
              onChange={(val) => {
                setCursorIndex(textareaRef.current?.selectionStart ?? 0);
                updateNodeText(val);
              }}
              onKeyUp={(e) => setCursorIndex(e.currentTarget.selectionStart)}
              onClick={(e) => setCursorIndex(e.currentTarget.selectionStart)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
