// settings.ts
import { PluginSettingTab, Setting, App, Notice } from 'obsidian';
import { PluginSettings } from './types';
import  LyubishevPlugin from './main';
import { Utils } from './utils';
import { HtmlHTMLAttributes } from 'vue';

export class LyubishevSettingTab extends PluginSettingTab {
  plugin: LyubishevPlugin;
  startDate: string = '';
  endDate: string = '';

  constructor(app: App, plugin: LyubishevPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.addColorPresets(containerEl);
    this.addActivityCategories(containerEl);
    this.addExportCSVButton(containerEl);
    this.addDateRangePicker(containerEl);
    this.addImportCSVButton(containerEl);
    this.addClearDataButton(containerEl);
    this.addSaveButton(containerEl);
  }
  private addSaveButton(containerEl:HTMLElement):void{
    new Setting(containerEl)
  .setName('Save Settings')
  .setDesc('Manually save all changes made to the settings.')
  .addButton(button => {
    button
      .setButtonText('Save')
      .setCta() // 设置为高亮按钮
      .onClick(async () => {
        try {
          await this.plugin.saveSettings(); // 保存设置
          new Notice('Settings saved successfully!'); // 弹出保存成功的通知
        } catch (error) {
          console.error('Error saving settings:', error);
          new Notice('Failed to save settings. Please check the console for details.'); // 弹出保存失败的通知
        }
      });
  });
  }

  private addColorPresets(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Color Presets')
      .setDesc('Add or remove custom color presets for quick selection.')
      .addButton(button => {
        button
          .setButtonText('Add Preset')
          .onClick(async () => {
            this.plugin.settings.colorPresets.push('#ffffff');
            await this.plugin.saveSettings();
            this.display();
          });
      });

    this.plugin.settings.colorPresets.forEach((color, index) => {
      new Setting(containerEl)
        .setName(`Preset ${index + 1}`)
        .addColorPicker(colorPicker => {
          colorPicker
            .setValue(color)
            .onChange(async (newColor) => {
              this.plugin.settings.colorPresets[index] = newColor;
              await this.plugin.saveSettings();
            });
        })
        .addButton(button => {
          button
            .setButtonText('Remove')
            .onClick(async () => {
              this.plugin.settings.colorPresets.splice(index, 1);
              await this.plugin.saveSettings();
              this.display();
            });
        });
    });
  }

  private addActivityCategories(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Activity Categories')
      .setDesc('Add or remove activity categories for tagging.')
      .addButton(button => {
        button
          .setButtonText('Add Category')
          .onClick(async () => {
            this.plugin.settings.activityCategories.push('New Category');
            await this.plugin.saveSettings();
            this.display();
          });
      });

    this.plugin.settings.activityCategories.forEach((category, index) => {
      new Setting(containerEl)
        .setName(`Category ${index + 1}`)
        .addText(text => {
          text
            .setValue(category)
            .onChange(async (newCategory) => {
              this.plugin.settings.activityCategories[index] = newCategory;
              await this.plugin.saveSettings();
            });
        })
        .addButton(button => {
          button
            .setButtonText('Remove')
            .onClick(async () => {
              this.plugin.settings.activityCategories.splice(index, 1);
              await this.plugin.saveSettings();
              this.display();
            });
        });
    });
  }

  private addExportCSVButton(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Export Data as CSV')
      .setDesc('Export time table data as a CSV file for the selected date range.')
      .addButton(button => {
        button
          .setButtonText('Export CSV')
          .onClick(async () => {
            if (!this.startDate || !this.endDate) {
              new Notice('Please select both start and end dates.');
              return;
            }
            try {
              Utils.exportDataAsCSV(this.startDate, this.endDate, this.plugin.cellColors);
              new Notice('CSV data exported successfully!');
            } catch (error) {
              console.error('Error exporting CSV:', error);
              new Notice('Failed to export CSV. Please check the console for details.');
            }
          });
      });
  }

  private addImportCSVButton(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Import CSV')
      .setDesc('Import time table data from a CSV file.')
      .addButton(button => {
        button
          .setButtonText('Import CSV')
          .setCta()
          .onClick(() => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv';
            fileInput.onchange = async (event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              if (file) {
                try {
                  const fileContent = await file.text();
                  Utils.importCSVData(fileContent, this.plugin);
                  await this.plugin.saveSettings();
                  await this.plugin.saveCellColors(this.plugin.cellColors);
                  new Notice('CSV data imported successfully!');
                  this.display();
                } catch (error) {
                  console.error('Error importing CSV:', error);
                  new Notice('Failed to import CSV. Please check the console for details.');
                }
              }
            };
            fileInput.click();
          });
      });
  }

  private addClearDataButton(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Clear All Data')
      .setDesc('This will remove all color presets, activity categories, and time table data.')
      .addButton(button => {
        button
          .setButtonText('Clear Data')
          .setWarning()
          .onClick(async () => {
            const confirmed = confirm('Are you sure you want to clear all data? This action cannot be undone.');
            if (!confirmed) return;
            this.plugin.settings.colorPresets = [];
            this.plugin.settings.activityCategories = [];
            this.plugin.cellColors = {};
            await this.plugin.saveSettings();
            await this.plugin.saveCellColors(this.plugin.cellColors);
            this.display();
          });
      });
  }

  private addDateRangePicker(containerEl: HTMLElement): void {
    const dateRangeContainer = containerEl.createDiv();
    dateRangeContainer.style.display = 'flex';
    dateRangeContainer.style.gap = '10px';
    dateRangeContainer.style.marginBottom = '20px';

    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.value = this.startDate;
    startDateInput.addEventListener('change', (event) => {
      this.startDate = (event.target as HTMLInputElement).value;
    });
    dateRangeContainer.appendChild(startDateInput);

    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.value = this.endDate;
    endDateInput.addEventListener('change', (event) => {
      this.endDate = (event.target as HTMLInputElement).value;
    });
    dateRangeContainer.appendChild(endDateInput);
  }
}