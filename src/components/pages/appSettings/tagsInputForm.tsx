import React, { useRef, useState } from "react";
import { TagsInput, ITag as IVoTTReactTag } from "vott-react";
// import 'vott-react/dist/css/tagsInput.css'
import "./tagsInputForm.scss";
import { constants } from "../../../common/constants";
import { strings } from "../../../common/strings";
import { AppError, ErrorCode, ITag } from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import { FileButtonSet } from "./buttons/fileButtonSet";
import TagEditorModal from "../../common/tagEditorModal";
import path from "path-browserify";

export interface ITagsInputFormProps {
  tags: ITag[];
  onChange: (tags: ITag[]) => void;
  tagColors: {
    [id: string]: string;
  };
  onTagClick?: (tag: ITag) => void;
  onCtrlTagClick?: (tag: ITag) => void;
  onShiftTagClick?: (tag: ITag) => void;
  onCtrlShiftTagClick?: (tag: ITag) => void;
  onImport?: (tags: ITag[]) => void;
  onExport?: () => void;
}

export const TagsInputForm: React.FC<ITagsInputFormProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ITag>();

  const tagsInput = useRef<TagsInput>(null);

  const toVoTTReactTags = (tags: ITag[]): IVoTTReactTag[] => {
    return tags.map((tag) => ({ name: tag.name, color: tag.color }));
  };

  const onChange = (vottReactTags: IVoTTReactTag[]) => {
    const tags: ITag[] = vottReactTags.reduce<ITag[]>((acc, cur) => {
      const tag = props.tags.find((t) => t.name == cur.name);
      if (!tag) {
        acc.push({ name: cur.name, color: cur.color });
      }
      return acc;
    }, []);
    if (tags) {
      props.onChange([...props.tags, ...tags]);
    }
  };
  const onShiftTagClick = (tagVott: IVoTTReactTag) => {
    const tag = props.tags.find((t) => t.name === tagVott.name);
    if (tag) {
      props.onCtrlShiftTagClick?.(tag);
    }
  };

  const onTagModalOk = (newTag: ITag) => {
    const newTags = props.tags.map((t) =>
      t.name === newTag.name ? newTag : t
    );

    props.onChange(newTags);
    setIsModalOpen(false);
    setSelectedTag(undefined);
  };

  const onImport = (fileInput: string) => {
    try {
      const tags = JSON.parse(fileInput);
      if (props.onImport) {
        props.onImport(tags);
      }
    } catch {
      throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
    }
  };

  const onExport = async (folderPath: string) => {
    const tagsFile = path.join(folderPath, constants.defaultTagsFile);
    await LocalFileSystem.writeText(
      tagsFile,
      JSON.stringify(props.tags, null, 4)
    );
    props.onExport?.();
  };

  return (
    <div>
      <TagsInput
        ref={tagsInput}
        tags={toVoTTReactTags(props.tags)}
        tagColors={constants.tagColors}
        onChange={onChange}
        placeHolder={strings.tags.placeholder}
        onShiftTagClick={onShiftTagClick}
      />
      <div className="my-2">
        <FileButtonSet onExport={onExport} onImport={onImport} />
      </div>
      <TagEditorModal
        show={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        tag={selectedTag}
        onOk={onTagModalOk}
        tagNameText={strings.tags.modal.name}
        tagColorText={strings.tags.modal.color}
        saveText={strings.common.save}
        cancelText={strings.common.cancel}
      />
    </div>
  );
};
