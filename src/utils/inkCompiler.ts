import type { Node, Edge } from '@xyflow/react';

export function compileGraphToInk(nodes: Node[], edges: Edge[], externalFunctions: string[] = []): string {
  let inkCode = "";

  for (const funcStr of externalFunctions) {
    inkCode += `EXTERNAL ${funcStr}\n`;
  }
  if (externalFunctions.length > 0) inkCode += `\n`;

  // Helper to find outgoing edges from a node
  const getOutgoingEdges = (nodeId: string) => edges.filter((e) => e.source === nodeId);

  // Helper to safely format knot names
  const generateKnotName = (node: Node) => {
    const label = (node.data.label as string) || '';
    if (!label || label.toLowerCase() === 'new knot' || label.toLowerCase() === 'start knot') {
      return `knot_${node.id.replace(/-/g, '_')}`;
    }
    const sanitized = label.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return sanitized || `knot_${node.id.replace(/-/g, '_')}`;
  };

  // We iterate over every DialogueNode and treat it as an Ink knot.
  const dialogueNodes = nodes.filter((n) => n.type === 'dialogue');

  // We find a start node to declare at the top (usually the one with no incoming edges, or the first one created)
  const incomingEdgesCount = (nodeId: string) => edges.filter((e) => e.target === nodeId).length;
  const startNode = dialogueNodes.find((n) => incomingEdgesCount(n.id) === 0) || dialogueNodes[0];

  if (startNode) {
    // Add a redirect to the start knot at the very top of the file so Ink knows where to begin.
    inkCode += `-> ${generateKnotName(startNode)}\n\n`;
  }

  // Iterate all dialogue nodes and generate their knots
  for (const node of dialogueNodes) {
    const safeNodeId = generateKnotName(node);
    inkCode += `=== ${safeNodeId} ===\n`;
    
    if (node.data.text) {
      inkCode += `${node.data.text}\n`;
    }

    const outEdges = getOutgoingEdges(node.id);
    
    if (outEdges.length === 0) {
      inkCode += `-> END\n\n`;
      continue;
    }

    // Process children
    for (const edge of outEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode) continue;

      if (targetNode.type === 'choice') {
        const isSticky = !!targetNode.data.isSticky;
        const isFallback = !!targetNode.data.isFallback;
        const symbol = isSticky ? '+' : '*';

        if (isFallback) {
          // Fallback choice directly navigates without text parsing
          const choiceOutEdges = getOutgoingEdges(targetNode.id);
          if (choiceOutEdges.length > 0) {
            const nextTarget = nodes.find((n) => n.id === choiceOutEdges[0].target);
            if (nextTarget && nextTarget.type === 'dialogue') {
              const safeNextId = generateKnotName(nextTarget);
              inkCode += `${symbol} -> ${safeNextId}\n`;
            } else {
              inkCode += `${symbol} -> END\n`;
            }
          } else {
            inkCode += `${symbol} -> END\n`;
          }
        } else {
          // Render standard choice
          const rawChoicePrompt = (targetNode.data.label as string);
          const choicePrompt = rawChoicePrompt && rawChoicePrompt !== 'Choice' ? rawChoicePrompt.replace(/[\r\n]+/g, ' ').trim() : "Continue...";
          inkCode += `${symbol} [${choicePrompt}]\n`;
          
          if (targetNode.data.text) {
            const bodyLines = (targetNode.data.text as string).split('\n');
            for (const line of bodyLines) {
              if (line.trim().length > 0) {
                inkCode += `    ${line}\n`;
              }
            }
          }
          
          // Find where this choice leads
          const choiceOutEdges = getOutgoingEdges(targetNode.id);
          if (choiceOutEdges.length > 0) {
            const nextTarget = nodes.find((n) => n.id === choiceOutEdges[0].target);
            if (nextTarget && nextTarget.type === 'dialogue') {
              const safeNextId = generateKnotName(nextTarget);
              inkCode += `    -> ${safeNextId}\n`;
            } else {
              inkCode += `    -> END\n`;
            }
          } else {
            inkCode += `    -> END\n`;
          }
        }
      } else if (targetNode.type === 'dialogue') {
        // Direct divergence to next node
        const safeNextId = generateKnotName(targetNode);
        inkCode += `-> ${safeNextId}\n`;
      }
    }
    
    inkCode += `\n`;
  }

  return inkCode.trim();
}
