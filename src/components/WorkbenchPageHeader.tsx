interface WorkbenchPageHeaderProps {
  description: string;
  title: string;
}

/** 工作台内容页共用的标题区，统一标题、说明文字与内容分割线。 */
export function WorkbenchPageHeader({ description, title }: WorkbenchPageHeaderProps) {
  return (
    <header className="WorkbenchPageHeader">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
