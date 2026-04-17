export default function handler(req, res) {
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.end(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABaElEQVRYhe3WvU/CQBgG8KfQYgCHYi0Ng5suhs1JE50wYXNxdfLfcnVxdMJEHCSxLsYBXGBzEEGwFPuBLfUciCghTa6FtA73br3L2+d3l+sHR0YmQYyViDOcAf4FgA/XRuB02nC1HlKSAl5aB5dIRgOwmnVotxV4tgnl+BSCrIQKDgUY3F1DV6sAgNx+GSuFjYXCgQBnwGrWp+EAh2xxZ+HwAAACrXb125ROI5lZjQ7gdF4wHvT/epZWVAD3vTdz/TWy4VlGdID5JRMYjYfoAMJafm5Mv7/BZ/vZt4eMneUBUkoBvCjNBrgOOhdn0NUqPGM4HfeMIT4eVXC8QAXgaD/HVquBt8tz3/lkOjsB2CbkoxNkNrepANTvgcxWEeJuyXfes014tglx75A6HAiwAz9ltZ6g1SoYa7NPhpCTIR6UA4WHAkyKwOm+wu13ARAIkoJUvhD8NuEBy6vY/wcYgAEYgAEYIHbANy0BgMiV56KKAAAAAElFTkSuQmCC", "base64"));
}