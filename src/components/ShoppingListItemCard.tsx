import { useState } from 'react';
import { ShoppingListItem, ItemStatus } from '@/types/database';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { AlertCircle, Check, X, Package, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ShoppingListItemCardProps {
  item: ShoppingListItem;
  canUpdate: boolean;
  onStatusChange: (status: ItemStatus) => void;
  onUpdate: (updates: Partial<ShoppingListItem>) => Promise<void>;
}

const itemStatusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  found: <Check className="h-4 w-4 text-success" />,
  not_found: <X className="h-4 w-4 text-destructive" />,
  alternative: <Package className="h-4 w-4 text-warning" />,
};

export function ShoppingListItemCard({ item, canUpdate, onStatusChange, onUpdate }: ShoppingListItemCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState(item.driver_comment || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveComment = async () => {
    setIsUpdating(true);
    try {
      await onUpdate({ driver_comment: comment.trim() || null });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAttachmentUpload = async (url: string) => {
    setIsUpdating(true);
    try {
      await onUpdate({ driver_attachment: url });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveAttachment = async () => {
    setIsUpdating(true);
    try {
      await onUpdate({ driver_attachment: null });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 p-3">
        <div className="shrink-0">
          {itemStatusIcons[item.status]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            Qty: {item.quantity} {item.details && `• ${item.details}`}
          </p>
          {item.driver_attachment && (
            <a
              href={item.driver_attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1"
            >
              <ImageIcon className="h-3 w-3" />
              {t('attachments.viewAttachment')}
            </a>
          )}
        </div>
        {canUpdate && (
          <div className="flex items-center gap-2">
            <Select
              value={item.status}
              onValueChange={(value) => onStatusChange(value as ItemStatus)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="found">{t('shoppingList.found', 'Найдено')}</SelectItem>
                <SelectItem value="not_found">{t('shoppingList.notFound', 'Не найдено')}</SelectItem>
                <SelectItem value="alternative">{t('shoppingList.alternative', 'Альтернатива')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && canUpdate && (
        <div className="border-t p-4 space-y-4 bg-secondary/30">
          {/* Driver Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('shoppingList.driverComment')}</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('shoppingList.addDriverNote')}
              rows={3}
            />
            <Button
              size="sm"
              onClick={handleSaveComment}
              disabled={isUpdating || comment === (item.driver_comment || '')}
            >
              {t('shoppingList.saveNote')}
            </Button>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('attachments.title')}</label>
            <FileUpload
              bucket="attachments"
              folder="shopping-items"
              existingFiles={item.driver_attachment ? [item.driver_attachment] : []}
              onUploadComplete={handleAttachmentUpload}
              onRemove={handleRemoveAttachment}
              maxFiles={1}
              maxSizeMB={10}
            />
          </div>
        </div>
      )}

      {/* Show comment if exists and not expanded */}
      {!isExpanded && item.driver_comment && (
        <div className="px-3 pb-3 border-t bg-secondary/30">
          <p className="text-sm text-warning mt-2">
            <strong>{t('shoppingList.note')}:</strong> {item.driver_comment}
          </p>
        </div>
      )}
    </div>
  );
}

