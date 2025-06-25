data_path = "../../Data/"
my_read_csv = function(file) readr::read_csv(paste0(data_path, file))

Exquisette = my_read_csv("Exquisette.csv")
Kay_Fashion = my_read_csv("Kay_Fashion.csv")