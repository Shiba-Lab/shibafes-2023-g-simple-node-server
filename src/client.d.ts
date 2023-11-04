export type Client = {
  uuid: string;
  role: string | undefined;
  ws: any;

  // 花の情報
  flowerText:      string,
  flowerCount:     number,
  flowerSizeRange: number[],
  flowerColor:     string[],
};
