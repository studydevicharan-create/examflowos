import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Star } from 'lucide-react';
import type { SyllabusNode } from '@/lib/types';
import { getNodes, updateNode, getNodeProgress } from '@/lib/store';

interface Props {
  nodeId: string;
  nodes: Record<string, SyllabusNode>;
  onNodeTap: (nodeId: string) => void;
  onRefresh: () => void;
}

export default function TreeNode({ nodeId, nodes, onNodeTap, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const node = nodes[nodeId];

  const hasChildren = node ? node.children.length > 0 : false;
  const progress = node ? getNodeProgress(nodeId, nodes) : 0;

  const toggleComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node) return;
    updateNode(nodeId, { completed: !node.completed, lastRevised: new Date().toISOString() });
    onRefresh();
  }, [nodeId, node, onRefresh]);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setExpanded(v => !v);
  }, [hasChildren]);

  if (!node) return null;
    e.stopPropagation();
    updateNode(nodeId, { completed: !node.completed, lastRevised: new Date().toISOString() });
    onRefresh();
  }, [nodeId, node.completed, onRefresh]);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setExpanded(v => !v);
  }, [hasChildren]);

  return (
    <div>
      <motion.div
        className="flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors hover:bg-secondary"
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        whileTap={{ scale: 0.98 }}
      >
        {hasChildren ? (
          <button onClick={toggleExpand} className="flex-shrink-0 p-0.5 text-muted-foreground">
            <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
        ) : (
          <div className="w-5" />
        )}

        <button
          onClick={toggleComplete}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all duration-150 ${
            node.completed
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/40'
          }`}
        >
          {node.completed && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>

        <button
          onClick={() => onNodeTap(nodeId)}
          className="flex flex-1 items-center justify-between min-w-0"
        >
          <span className={`text-sm truncate ${node.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {node.title}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {node.important && <Star className="h-3 w-3 text-warning fill-warning" />}
            {hasChildren && (
              <span className="text-[10px] text-muted-foreground">{progress}%</span>
            )}
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {node.children.map(childId => (
              <TreeNode
                key={childId}
                nodeId={childId}
                nodes={nodes}
                onNodeTap={onNodeTap}
                onRefresh={onRefresh}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
