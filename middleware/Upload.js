
import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
  ];

  if (
    allowedTypes.includes(file.mimetype)
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only png, jpg and jpeg allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
});

export default upload;