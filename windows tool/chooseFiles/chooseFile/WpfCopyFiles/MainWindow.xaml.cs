
using System.Collections.Specialized;
using System.IO;

using System.Windows;

using System.Windows.Input;

namespace WpfCopyFiles
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        static string cuurentDir = Environment.CurrentDirectory;
        public MainWindow()
        {
            InitializeComponent();

        }

        private void btncopy_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string extantion = txtvalue.Text;
                if (string.IsNullOrEmpty(extantion))
                    return;
                string[] files = AllFiles(cuurentDir);
                var collectionFile = new StringCollection();
                var data = new DataObject();
                foreach (string file in files)
                {

                    if (System.IO.Path.GetExtension(file).Equals($".{extantion}".Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        collectionFile.Add(file);
                    }

                }
                data.SetFileDropList(collectionFile);
                Clipboard.SetDataObject(data, true);
            }
            catch (Exception ex)
            {
                MessageBox.Show("בדוק אם הסומת תקינה, אם כן הקובץ לא נמצאה בתקייה זו!", "שגיאה");
            }

        }
       

        string[] AllFiles(string dirPath)
        {
            string[] res = Directory.GetFiles(dirPath);
            return res;
        }

        private void btndel_Click(object sender, RoutedEventArgs e)
        {
            string extantion = txtvalue.Text.Trim();

            List<string> filesToDelete = new List<string>();
            foreach (string file in AllFiles(cuurentDir))
            {
                if (System.IO.Path.GetExtension(file).Equals($".{extantion}".Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    filesToDelete.Add(file);
                }
            }

            if (filesToDelete.Count > 0)
            {
                var res = MessageBox.Show($"you sure by del all {extantion} files ({filesToDelete.Count})", "warning", MessageBoxButton.YesNo, MessageBoxImage.Warning);
                if (res == MessageBoxResult.Yes)
                {
                    foreach (string file in filesToDelete)
                    {
                        File.Delete(file);

                    }
               
                }
                
            }

        }

        private void txtvalue_KeyDown(object sender, KeyEventArgs e)
        {
            string extantion = txtvalue.Text.Trim();
            string[] res = AllFiles(cuurentDir);
            List<string> countFiles = new List<string>();
            foreach (string file in res)
            {
                if(System.IO.Path.GetExtension(file).Equals($".{extantion}", StringComparison.OrdinalIgnoreCase))
                {
                    countFiles.Add(file);
                }
            }
            txtcount.Text = countFiles.Count.ToString();
        }
    }
}