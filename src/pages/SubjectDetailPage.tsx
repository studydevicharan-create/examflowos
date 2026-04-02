import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X } from 'lucide-react';
import TreeNode from '@/components/TreeNode';
import { getSubjects, getNodes, addChildNode, getNodeProgress } from '@/lib/store';

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(getNodes);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const subject = getSubjects().find(s => s.id === id);
  if (!subject) return <div className="p-4 text-muted-foreground">Subject not found</div>;

  const rootNode = nodes[subject.rootNodeId];
  const progress = getNodeProgress(subject.rootNodeId, nodes);

  const refresh = useCallback(() => setNodes(getNodes()), []);

  const handleAddChild = (parentId: string) => {
    if (!newTitle.trim()) return;
    addChildNode(parentId, newTitle.trim());
    setNewTitle('');
    setShowAdd(null);
    refresh();
  };

  return (
    <div className="flex min-h-screen flex-col pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/subjects')} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{subject.title}</h1>
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(subject.rootNodeId)}
          className="rounded-full bg-primary p-1.5 text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="mt-2 mx-4 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Tree */}
      <div className="mt-4 px-2">
        {rootNode?.children.map(childId => (
          <TreeNode
            key={childId}
            nodeId={childId}
            nodes={nodes}
            onNodeTap={(nodeId) => {
              const node = nodes[nodeId];
              if (node && node.children.length > 0) {
                // Has children, allow adding sub-items
                setShowAdd(nodeId);
              } else {
                navigate(`/topic/${nodeId}`);
              }
            }}
            onRefresh={refresh}
          />
        ))}
        {rootNode?.children.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">No units yet</p>
            <button onClick={() => setShowAdd(subject.rootNodeId)} className="mt-2 text-sm text-primary">
              Add first unit
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAdd(null)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[768px] rounded-t-2xl border-t border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Add to {nodes[showAdd]?.title || 'Node'}
                </h2>
                <button onClick={() => setShowAdd(null)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddChild(showAdd)}
                placeholder="Title"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => handleAddChild(showAdd)}
                disabled={!newTitle.trim()}
                className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Add
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
